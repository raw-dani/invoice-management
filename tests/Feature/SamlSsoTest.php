<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SamlSsoTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Company $company;

    private const SAMPLE_CERT = "-----BEGIN CERTIFICATE-----\n" .
        "MIICrTCCAZWgAwIBAgIBADANBgkqhkiG9w0BAQUFADAaMRgwFgYDVQQDDA9zc28u\n" .
        "ZXhhbXBsZS5jb20wHhcNMjYxMDExMDIwMjQ4WhcNMjcxMDExMDIwMjQ4WjAaMRgw\n" .
        "FgYDVQQDDA9zc28uZXhhbXBsZS5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw\n" .
        "ggEKAoIBAQDC95BlLFEnUAZN8bnI9l1Ob74p9BRoVMRRxDrB8NPgGu9+iccnB1ro\n" .
        "X4/DcM8L96LMeRShUkD0TbmdgNZ6u98Jq49SjmkZ/ZwnYsn200yet4UJU57IHhKP\n" .
        "+YsjzZDePyhi0R4SLXBW8GPXJdYvd65fxVmrUfUJnHTqB6Qq3QZfTLmtKWPUCjal\n" .
        "HhU4+njPu9+3l9yhy7SiQus/rLIoOKsZslAPzcCwPG3Znr2DDNPXFp0+epCA5ych\n" .
        "t+VWKk2/zQU1kHZEEkr/BRpbQCEEIq8udl0TIwBIs8A49SWAPyEr+Kyms3NhC436\n" .
        "4zKOiFuaDX2UM6xwb54JHTwwqaZu4lqtAgMBAAEwDQYJKoZIhvcNAQEFBQADggEB\n" .
        "AFaa4n4BoadorWFsRCt6TvR2+ZEo+zTb9yjK3b+3xCWH3ASXaQDztSWExaHclC7/\n" .
        "+2ZW/0n098J0QsyoW8SMJcqmrvh5V8Y0q502MIFQFrBrllfrhKg/I67n3EP0jcSu\n" .
        "RxODHioP57lz6IRrrXL/2aja8zKRixUwnbTN50iTWeOqV60r0Gv63NUdBP+buynC\n" .
        "HSZtR6SgKbsgONSwCGW2QQocrhH+OhGYkudGzb74hUtCv/Luive1ED4C71ahPOj6\n" .
        "OCH62tmG6RBUePfZo2YyACppe7CL8/A6L+/Wjmq5dr93ruLioZ0/wJpqk3ob+oic\n" .
        "2bJw6CSnqXrgYtRLFtrw11s=\n" .
        "-----END CERTIFICATE-----";

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'PT Enterprise SAML',
            'email' => 'admin@enterprisesaml.com',
            'currency' => 'IDR',
        ]);

        $this->admin = User::factory()->create([
            'company_id' => $this->company->id,
            'role' => 'admin',
        ]);
    }

    public function test_saml_status_endpoint_returns_initial_state(): void
    {
        $response = $this->getJson('/api/saml/status');

        $response->assertStatus(200)
            ->assertJson([
                'enabled' => false,
            ]);
    }

    public function test_saml_metadata_endpoint_returns_valid_sp_xml(): void
    {
        $response = $this->get('/api/saml/metadata');

        $response->assertStatus(200);
        $this->assertStringStartsWith('application/xml', $response->headers->get('Content-Type'));

        $content = $response->getContent();
        $this->assertStringContainsString('EntityDescriptor', $content);
        $this->assertStringContainsString('SPSSODescriptor', $content);
        $this->assertStringContainsString('/api/saml/acs', $content);
    }

    public function test_admin_can_save_and_retrieve_saml_settings(): void
    {
        $payload = [
            'saml_enabled' => '1',
            'idp_entity_id' => 'https://accounts.google.com/o/saml2?idpid=C01234567',
            'idp_sso_url' => 'https://accounts.google.com/o/saml2/idp?idpid=C01234567',
            'idp_slo_url' => '',
            'idp_x509_cert' => self::SAMPLE_CERT,
            'auto_provision_users' => '1',
            'default_role' => 'staff',
        ];

        $saveResponse = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/settings/saml', $payload);

        $saveResponse->assertStatus(200);

        $getResponse = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/settings/saml');

        $getResponse->assertStatus(200)
            ->assertJson([
                'data' => [
                    'saml_enabled' => '1',
                    'idp_entity_id' => 'https://accounts.google.com/o/saml2?idpid=C01234567',
                    'idp_sso_url' => 'https://accounts.google.com/o/saml2/idp?idpid=C01234567',
                    'auto_provision_users' => '1',
                    'default_role' => 'staff',
                ],
            ]);

        // Status should now be enabled and identify the provider host
        $statusResponse = $this->getJson('/api/saml/status');
        $statusResponse->assertStatus(200)
            ->assertJson([
                'enabled' => true,
                'idp_name' => 'accounts.google.com',
            ]);
    }

    public function test_saml_test_endpoint_validates_x509_certificate(): void
    {
        // 1. Missing cert should fail validation
        $responseBad = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/saml/test', [
                'idp_entity_id' => 'https://idp.example.com',
                'idp_sso_url' => 'https://idp.example.com/sso',
                'idp_x509_cert' => '',
            ]);

        $responseBad->assertStatus(422);

        // 2. Valid cert should pass validation and return subject & expiration info
        $responseGood = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/saml/test', [
                'idp_entity_id' => 'https://sso.example.com/entity',
                'idp_sso_url' => 'https://sso.example.com/app/sso',
                'idp_x509_cert' => self::SAMPLE_CERT,
            ]);

        $responseGood->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'valid' => true,
                    'subject' => 'sso.example.com',
                ],
            ]);
    }

    public function test_saml_login_redirects_when_configured(): void
    {
        // Configure SAML first
        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/settings/saml', [
                'saml_enabled' => '1',
                'idp_entity_id' => 'https://idp.okta.com/exk123',
                'idp_sso_url' => 'https://idp.okta.com/app/sso',
                'idp_x509_cert' => self::SAMPLE_CERT,
            ]);

        $response = $this->get('/api/saml/login');

        // Should redirect to Okta SSO URL with SAMLRequest parameter
        $response->assertStatus(302);
        $redirectUrl = $response->headers->get('Location');
        $this->assertStringContainsString('https://idp.okta.com/app/sso', $redirectUrl);
        $this->assertStringContainsString('SAMLRequest=', $redirectUrl);
    }

    public function test_saml_acs_handles_missing_or_invalid_response_gracefully(): void
    {
        $response = $this->post('/api/saml/acs', [
            'SAMLResponse' => 'invalid-base64-payload',
        ]);

        // Should redirect back to frontend /login with saml_error parameter, not crash with 500
        $response->assertStatus(302);
        $redirectUrl = $response->headers->get('Location');
        $this->assertStringContainsString('/login?saml_error=', $redirectUrl);
    }
}
