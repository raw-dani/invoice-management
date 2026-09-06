<x-app-layout :pageTitle="'Quotes'">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h2 class="text-2xl font-bold text-gray-800">Quotes</h2>
            <p class="text-gray-600">Manage your quotes</p>
        </div>
        <a href="{{ route('quotes.create') }}" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">+ Create Quote</a>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <form action="{{ route('quotes.index') }}" method="GET" class="flex gap-4">
            <input type="text" name="search" value="{{ request('search') }}" placeholder="Search quotes..." class="flex-1 border rounded-lg px-4 py-2">
            <select name="status" class="border rounded-lg px-4 py-2">
                <option value="">All Status</option>
                <option value="draft" {{ request('status') == 'draft' ? 'selected' : '' }}>Draft</option>
                <option value="sent" {{ request('status') == 'sent' ? 'selected' : '' }}>Sent</option>
                <option value="accepted" {{ request('status') == 'accepted' ? 'selected' : '' }}>Accepted</option>
                <option value="rejected" {{ request('status') == 'rejected' ? 'selected' : '' }}>Rejected</option>
                <option value="converted" {{ request('status') == 'converted' ? 'selected' : '' }}>Converted</option>
                <option value="expired" {{ request('status') == 'expired' ? 'selected' : '' }}>Expired</option>
            </select>
            <button type="submit" class="bg-gray-100 px-4 py-2 rounded-lg">Filter</button>
        </form>
    </div>

    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <table class="w-full">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($quotes as $quote)
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4"><a href="{{ route('quotes.show', $quote) }}" class="text-blue-600 font-medium">{{ $quote->quote_number }}</a></td>
                        <td class="px-6 py-4">{{ $quote->customer->company_name }}</td>
                        <td class="px-6 py-4">{{ $quote->quote_date->format('d M Y') }}</td>
                        <td class="px-6 py-4 font-medium">Rp {{ number_format($quote->total, 0, ',', '.') }}</td>
                        <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full bg-{{ $quote->status_color }}-100 text-{{ $quote->status_color }}-800">{{ ucfirst($quote->status) }}</span></td>
                        <td class="px-6 py-4 text-right"><a href="{{ route('quotes.show', $quote) }}" class="text-blue-600">View</a></td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">No quotes found</td></tr>
                @endforelse
            </tbody>
        </table>
        @if($quotes->hasPages())
            <div class="px-6 py-4 border-t">{{ $quotes->links() }}</div>
        @endif
    </div>
</x-app-layout>