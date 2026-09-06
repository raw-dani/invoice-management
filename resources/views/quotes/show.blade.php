<x-app-layout :pageTitle="$quote->quote_number">
    <div class="mb-6 flex justify-between items-center">
        <a href="{{ route('quotes.index') }}" class="text-blue-600">← Back to Quotes</a>
        <div class="flex gap-2">
            @if($quote->status === 'draft')
                <form action="{{ route('quotes.send', $quote) }}" method="POST" class="inline">
                    @csrf
                    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Send</button>
                </form>
                <a href="{{ route('quotes.edit', $quote) }}" class="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm">Edit</a>
            @endif
            @if(in_array($quote->status, ['sent', 'viewed']))
                <form action="{{ route('quotes.accept', $quote) }}" method="POST" class="inline">
                    @csrf
                    <button type="submit" class="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm">Accept</button>
                </form>
                <form action="{{ route('quotes.reject', $quote) }}" method="POST" class="inline">
                    @csrf
                    <button type="submit" class="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">Reject</button>
                </form>
            @endif
            @if($quote->status === 'accepted' && !$quote->invoice_id)
                <form action="{{ route('quotes.convert-to-invoice', $quote) }}" method="POST" class="inline" onsubmit="return confirm('Convert this quote to invoice?')">
                    @csrf
                    <button type="submit" class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm">Convert to Invoice</button>
                </form>
            @endif
            @if($quote->status === 'converted' && $quote->invoice_id)
                <a href="{{ route('invoices.show', $quote->invoice_id) }}" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">View Invoice</a>
            @endif
        </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm p-8">
        <div class="flex justify-between items-start mb-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">{{ $quote->quote_number }}</h1>
                <span class="px-3 py-1 text-sm rounded-full bg-{{ $quote->status_color }}-100 text-{{ $quote->status_color }}-800 mt-2 inline-block">{{ ucfirst($quote->status) }}</span>
            </div>
            <div class="text-right">
                <p class="text-sm text-gray-500">Quote Date</p>
                <p class="font-medium">{{ $quote->quote_date->format('d M Y') }}</p>
                @if($quote->valid_until)
                    <p class="text-sm text-gray-500 mt-2">Valid Until</p>
                    <p class="font-medium">{{ $quote->valid_until->format('d M Y') }}</p>
                @endif

        <div class="mb-8">
            <p class="text-sm text-gray-500">Bill To</p>
            <p class="font-medium text-lg">{{ $quote->customer->company_name }}</p>
            <p class="text-gray-600">{{ $quote->customer->address ?? '' }}</p>
        </div>

        <table class="w-full mb-8">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-500">Qty</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-500">Price</th>
                    <th class="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                @foreach($quote->items as $item)
                    <tr>
                        <td class="px-4 py-3">{{ $item->description }}</td>
                        <td class="px-4 py-3 text-right">{{ $item->quantity }}</td>
                        <td class="px-4 py-3 text-right">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                        <td class="px-4 py-3 text-right">Rp {{ number_format($item->total, 0, ',', '.') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="flex justify-end">
            <div class="w-64 space-y-2">
                <div class="flex justify-between"><span>Subtotal</span><span>Rp {{ number_format($quote->subtotal, 0, ',', '.') }}</span></div>
                @if($quote->discount > 0)
                    <div class="flex justify-between"><span>Discount</span><span>- Rp {{ number_format($quote->discount, 0, ',', '.') }}</span></div>
                @endif
                @if($quote->tax_amount > 0)
                    <div class="flex justify-between"><span>Tax</span><span>Rp {{ number_format($quote->tax_amount, 0, ',', '.') }}</span></div>
                @endif
                <div class="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>Rp {{ number_format($quote->total, 0, ',', '.') }}</span></div>
            </div>
        </div>
    </div>
</x-app-layout>