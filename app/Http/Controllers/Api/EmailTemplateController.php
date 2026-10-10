<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmailTemplateRequest;
use App\Http\Requests\UpdateEmailTemplateRequest;
use App\Http\Resources\EmailLogResource;
use App\Http\Resources\EmailTemplateResource;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmailTemplateController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $companyId = auth()->user()->company_id;
        $custom = EmailTemplate::where('company_id', $companyId)->get()->keyBy('slug');
        $defaults = EmailTemplate::whereNull('company_id')->get()->keyBy('slug');

        $slugs = array_unique(array_merge(EmailTemplate::SLUGS, $defaults->keys()->all(), $custom->keys()->all()));

        $templates = collect($slugs)->map(function ($slug) use ($custom, $defaults) {
            return $custom->get($slug) ?? $defaults->get($slug);
        })->filter()->values();

        return EmailTemplateResource::collection($templates);
    }

    public function store(StoreEmailTemplateRequest $request): JsonResponse
    {
        $template = EmailTemplate::updateOrCreate(
            ['company_id' => auth()->user()->company_id, 'slug' => $request->validated('slug')],
            [...$request->safe()->except('slug')->toArray(), 'is_default' => false]
        );

        return (new EmailTemplateResource($template))->response()->setStatusCode(201);
    }

    public function show(EmailTemplate $emailTemplate): EmailTemplateResource
    {
        $this->authorizeTemplate($emailTemplate);

        return new EmailTemplateResource($emailTemplate);
    }

    public function update(UpdateEmailTemplateRequest $request, EmailTemplate $emailTemplate): EmailTemplateResource
    {
        $this->authorizeTemplate($emailTemplate, true);
        $emailTemplate->update($request->validated());

        return new EmailTemplateResource($emailTemplate->fresh());
    }

    public function destroy(EmailTemplate $emailTemplate): JsonResponse
    {
        $this->authorizeTemplate($emailTemplate, true);
        $emailTemplate->delete();

        return response()->json(['message' => 'Email template deleted successfully.']);
    }

    public function restore(string $slug): EmailTemplateResource
    {
        abort_unless(in_array($slug, EmailTemplate::SLUGS, true), 404);
        EmailTemplate::where('company_id', auth()->user()->company_id)->where('slug', $slug)->delete();
        $default = EmailTemplate::whereNull('company_id')->where('slug', $slug)->firstOrFail();

        return new EmailTemplateResource($default);
    }

    public function logs(Request $request): AnonymousResourceCollection
    {
        $query = EmailLog::where('company_id', auth()->user()->company_id)->latest();
        if ($request->filled('status')) $query->where('status', $request->string('status'));
        if ($request->filled('template')) $query->where('template_slug', $request->string('template'));

        return EmailLogResource::collection($query->paginate(min((int) $request->input('per_page', 20), 100)));
    }

    private function authorizeTemplate(EmailTemplate $template, bool $customOnly = false): void
    {
        if ($customOnly && $template->company_id !== auth()->user()->company_id) {
            abort(403, 'Default templates cannot be modified.');
        }
        if (!$customOnly && $template->company_id !== null && $template->company_id !== auth()->user()->company_id) {
            abort(403, 'Unauthorized action.');
        }
    }
}