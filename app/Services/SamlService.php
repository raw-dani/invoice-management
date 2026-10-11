<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use OneLogin\Saml2\Auth as SamlAuth;
use OneLogin\Saml2\Settings as SamlSettings;
use OneLogin\Saml2\Utils as SamlUtils;
use RuntimeException;

class SamlService
{
    /**
     * Retrieve and build OneLogin SAML configuration array for a specific company.
     */
    public function getSamlConfig(int $companyId): array
    {
        $settings = Setting::where('company_id', $companyId)->pluck('value', 'key')->toArray();

        $spEntityId = !empty($settings['sp_entity_id']) ? $settings['sp_entity_id'] : url('/api/saml/metadata');
        $acsUrl     = url('/api/saml/acs');
        $slsUrl     = url('/api/saml/sls');

        $idpEntityId = $settings['idp_entity_id'] ?? '';
        $idpSsoUrl   = $settings['idp_sso_url'] ?? '';
        $idpSloUrl   = !empty($settings['idp_slo_url']) ? $settings['idp_slo_url'] : $idpSsoUrl;
        $idpCert     = $this->cleanCertificate($settings['idp_x509_cert'] ?? '');

        return [
            'strict' => false,
            'debug'  => (bool) config('app.debug', false),
            'sp' => [
                'entityId' => $spEntityId,
                'assertionConsumerService' => [
                    'url'     => $acsUrl,
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
                ],
                'singleLogoutService' => [
                    'url'     => $slsUrl,
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
                'NameIDFormat' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
                'x509cert'   => '',
                'privateKey' => '',
            ],
            'idp' => [
                'entityId' => $idpEntityId,
                'singleSignOnService' => [
                    'url'     => $idpSsoUrl,
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
                'singleLogoutService' => [
                    'url'     => $idpSloUrl,
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
                'x509cert' => $idpCert,
            ],
            'security' => [
                'nameIdEncrypted'       => false,
                'authnRequestsSigned'   => false,
                'logoutRequestSigned'   => false,
                'logoutResponseSigned'  => false,
                'wantMessagesSigned'    => false,
                'wantAssertionsSigned'  => false,
                'wantNameId'            => true,
                'wantNameIdEncrypted'   => false,
                'requestedAuthnContext' => false,
                'relaxDestinationValidation' => true,
                'lowercaseUrlencoding'  => false,
            ],
        ];
    }

    /**
     * Clean and normalize raw X.509 certificate string.
     */
    public function cleanCertificate(?string $cert): string
    {
        if (empty($cert)) {
            return '';
        }

        // Remove PEM header / footer and white spaces
        $clean = str_replace(
            ['-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----', "\r", "\n", ' ', "\t"],
            '',
            $cert
        );

        return trim($clean);
    }

    /**
     * Format clean base64 cert back to standard PEM format with headers.
     */
    public function formatCertificatePem(string $cleanCert): string
    {
        $clean = $this->cleanCertificate($cleanCert);
        if (empty($clean)) {
            return '';
        }

        $chunks = chunk_split($clean, 64, "\n");
        return "-----BEGIN CERTIFICATE-----\n" . trim($chunks) . "\n-----END CERTIFICATE-----";
    }

    /**
     * Generate SP XML Metadata for IdP configuration (Google Workspace, Okta, Azure AD).
     */
    public function getSpMetadataXml(int $companyId = 1): string
    {
        $config = $this->getSamlConfig($companyId);
        $samlSettings = new SamlSettings($config, true);
        $metadata = $samlSettings->getSPMetadata();

        $errors = $samlSettings->validateMetadata($metadata);
        if (!empty($errors)) {
            throw new RuntimeException('Invalid SP metadata: ' . implode(', ', $errors));
        }

        return $metadata;
    }

    /**
     * Generate IdP redirect URL for SP-initiated SSO login.
     */
    public function getLoginUrl(int $companyId = 1, ?string $returnTo = null): string
    {
        $config = $this->getSamlConfig($companyId);

        if (empty($config['idp']['singleSignOnService']['url'])) {
            throw new RuntimeException('SAML SSO belum dikonfigurasi. Harap atur IdP SSO URL pada menu pengaturan.');
        }

        $auth = new SamlAuth($config);
        return $auth->login($returnTo, [], false, false, true);
    }

    /**
     * Process Assertion Consumer Service (ACS) incoming SAML response from IdP.
     */
    public function processAcsResponse(Request $request, int $companyId = 1): User
    {
        $config = $this->getSamlConfig($companyId);
        $auth = new SamlAuth($config);

        // Process response
        $auth->processResponse();

        $errors = $auth->getErrors();
        if (!empty($errors)) {
            $reason = $auth->getLastErrorReason();
            throw new RuntimeException('SAML Authentication Error: ' . implode(', ', $errors) . ($reason ? " ($reason)" : ''));
        }

        if (!$auth->isAuthenticated()) {
            throw new RuntimeException('SAML authentication failed: User is not authenticated.');
        }

        // Extract attributes
        $nameId = $auth->getNameId();
        $attributes = $auth->getAttributes();

        $companySettings = Setting::where('company_id', $companyId)->pluck('value', 'key');
        $emailAttrKey = $companySettings['attribute_mapping_email'] ?: 'email';
        $nameAttrKey  = $companySettings['attribute_mapping_name'] ?: 'name';

        // Extract email
        $email = null;
        if (!empty($attributes[$emailAttrKey][0])) {
            $email = $attributes[$emailAttrKey][0];
        } elseif (!empty($attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'][0])) {
            $email = $attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'][0];
        } elseif (!empty($attributes['mail'][0])) {
            $email = $attributes['mail'][0];
        } elseif (filter_var($nameId, FILTER_VALIDATE_EMAIL)) {
            $email = $nameId;
        }

        if (empty($email)) {
            throw new RuntimeException('Tidak dapat menemukan atribut email pengguna dari SAML assertion IdP.');
        }

        // Extract name
        $name = null;
        if (!empty($attributes[$nameAttrKey][0])) {
            $name = $attributes[$nameAttrKey][0];
        } elseif (!empty($attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'][0])) {
            $name = $attributes['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'][0];
        } elseif (!empty($attributes['displayName'][0])) {
            $name = $attributes['displayName'][0];
        } elseif (!empty($attributes['cn'][0])) {
            $name = $attributes['cn'][0];
        } elseif (!empty($attributes['firstName'][0])) {
            $name = $attributes['firstName'][0] . (!empty($attributes['lastName'][0]) ? ' ' . $attributes['lastName'][0] : '');
        } else {
            $name = strstr($email, '@', true) ?: $email;
        }

        // Find or provision user
        $user = User::where('company_id', $companyId)->where('email', $email)->first();

        if (!$user) {
            $autoProvision = filter_var($companySettings['auto_provision_users'] ?? '1', FILTER_VALIDATE_BOOLEAN);
            if (!$autoProvision) {
                throw new RuntimeException("Pengguna {$email} belum terdaftar dan fitur auto-provisioning dinonaktifkan.");
            }

            $defaultRole = $companySettings['default_role'] ?? 'staff';
            if (!in_array($defaultRole, ['admin', 'staff', 'viewer'])) {
                $defaultRole = 'staff';
            }

            $user = User::create([
                'name'              => $name,
                'email'             => $email,
                'password'          => Hash::make(Str::random(32)),
                'company_id'        => $companyId,
                'role'              => $defaultRole,
                'email_verified_at' => now(),
            ]);
        } else {
            // Update name if changed
            if (!empty($name) && $user->name !== $name) {
                $user->update(['name' => $name]);
            }
        }

        return $user;
    }

    /**
     * Validate an IdP configuration for preview / testing.
     */
    public function testConfiguration(array $input): array
    {
        $idpEntityId = trim($input['idp_entity_id'] ?? '');
        $idpSsoUrl   = trim($input['idp_sso_url'] ?? '');
        $certRaw     = trim($input['idp_x509_cert'] ?? '');

        $errors = [];

        if (empty($idpEntityId)) {
            $errors[] = 'IdP Entity ID (Issuer) wajib diisi.';
        }

        if (empty($idpSsoUrl) || !filter_var($idpSsoUrl, FILTER_VALIDATE_URL)) {
            $errors[] = 'IdP Single Sign-On (SSO) URL harus berupa URL valid.';
        }

        if (empty($certRaw)) {
            $errors[] = 'X.509 Certificate wajib diisi.';
        } else {
            $clean = $this->cleanCertificate($certRaw);
            $pem = $this->formatCertificatePem($clean);
            $parsed = @openssl_x509_parse($pem);
            if (!$parsed) {
                $errors[] = 'X.509 Certificate tidak valid atau format rusak.';
            } else {
                $validTo = $parsed['validTo_time_t'] ?? 0;
                $subject = $parsed['subject']['CN'] ?? ($parsed['subject']['O'] ?? 'IdP Certificate');
                return [
                    'valid'     => empty($errors),
                    'errors'    => $errors,
                    'subject'   => $subject,
                    'expires_at' => $validTo ? date('Y-m-d H:i:s', $validTo) : null,
                    'is_expired' => $validTo ? (time() > $validTo) : false,
                ];
            }
        }

        return [
            'valid'  => empty($errors),
            'errors' => $errors,
        ];
    }
}
