<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Setting;
use App\Services\SamlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Throwable;

class SamlController extends Controller
{
    public function __construct(protected SamlService $samlService)
    {
    }

    /**
     * Public endpoint to check if SAML SSO is enabled for the default company.
     * Used by the Frontend Login page to conditionally display the SSO login button.
     */
    public function status(): JsonResponse
    {
        $companyId = Company::first()?->id ?? 1;
        $settings = Setting::where('company_id', $companyId)->pluck('value', 'key')->toArray();

        $enabled = filter_var($settings['saml_enabled'] ?? '0', FILTER_VALIDATE_BOOLEAN) && !empty($settings['idp_sso_url']);
        $idpEntityId = $settings['idp_entity_id'] ?? '';
        $idpName = 'Identity Provider';
        if (!empty($idpEntityId)) {
            $parsedHost = parse_url($idpEntityId, PHP_URL_HOST);
            $idpName = $parsedHost ?: $idpEntityId;
        }

        return response()->json([
            'enabled'   => $enabled,
            'idp_name'  => $idpName,
            'login_url' => url('/api/saml/login'),
        ]);
    }

    /**
     * Download or view Service Provider (SP) Metadata XML.
     * Used by Google Workspace, Azure AD, Okta to import app configuration.
     */
    public function metadata(Request $request): Response
    {
        $companyId = Company::first()?->id ?? 1;

        try {
            $xml = $this->samlService->getSpMetadataXml($companyId);

            $headers = ['Content-Type' => 'application/xml; charset=utf-8'];
            if ($request->boolean('download')) {
                $headers['Content-Disposition'] = 'attachment; filename="saml-sp-metadata.xml"';
            }

            return response($xml, 200, $headers);
        } catch (Throwable $e) {
            return response(
                '<error>' . htmlspecialchars($e->getMessage()) . '</error>',
                500,
                ['Content-Type' => 'application/xml; charset=utf-8']
            );
        }
    }

    /**
     * Initiate SP-initiated SAML login flow.
     * Redirects browser to IdP SSO endpoint with encoded SAMLRequest.
     */
    public function login(Request $request)
    {
        $companyId = Company::first()?->id ?? 1;

        try {
            $returnTo = $request->query('return_to', url('/'));
            $redirectUrl = $this->samlService->getLoginUrl($companyId, $returnTo);

            return redirect()->away($redirectUrl);
        } catch (Throwable $e) {
            return redirect(url('/login?saml_error=' . urlencode($e->getMessage())));
        }
    }

    /**
     * Assertion Consumer Service (ACS).
     * Receives SAMLResponse from Identity Provider (Google / Azure / Okta).
     */
    public function acs(Request $request)
    {
        $companyId = Company::first()?->id ?? 1;

        try {
            $user = $this->samlService->processAcsResponse($request, $companyId);

            // Generate Sanctum token for API authentication
            $token = $user->createToken('saml-sso')->plainTextToken;

            // Redirect back to frontend with the token
            return redirect(url('/login?saml_token=' . urlencode($token)));
        } catch (Throwable $e) {
            return redirect(url('/login?saml_error=' . urlencode($e->getMessage())));
        }
    }

    /**
     * Single Logout Service (SLS).
     */
    public function sls(Request $request)
    {
        if (Auth::check()) {
            Auth::user()->tokens()->delete();
        }

        return redirect(url('/login?message=' . urlencode('Berhasil logout dari SAML SSO.')));
    }

    /**
     * Admin tool: Test and validate an IdP configuration before saving.
     */
    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'idp_entity_id' => 'required|string',
            'idp_sso_url'   => 'required|url',
            'idp_x509_cert' => 'required|string',
        ]);

        $result = $this->samlService->testConfiguration($validated);

        return response()->json([
            'success' => $result['valid'],
            'data'    => $result,
        ]);
    }
}
