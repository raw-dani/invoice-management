<x-app-layout :pageTitle="'Edit Quote'">
    <div class="max-w-4xl mx-auto">
        <div class="mb-6"><a href="{{ route('quotes.index') }}" class="text-blue-600">← Back to Quotes</a></div>
        <form action="{{ route('quotes.update', $quote->id) }}" method="POST" id="quoteForm">
            @method('PUT')
            @csrf
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 class="text-lg font-bold mb-4">Quote Details</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Customer *</label>
                        <select name="customer_id" required class="w-full border rounded-lg px-4 py-2">
                            <option value="">Select</option>
                            @foreach($customers as $c)
                                <option value="{{ $c->id }}" {{ ($quote->customer_id == $c->id) ? 'selected' : '' }}>{{ $c->company_name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Currency</label>
                        <select name="currency" class="w-full border rounded-lg px-4 py-2">
                            <option value="IDR" {{ $quote->currency == 'IDR' ? 'selected' : '' }}>IDR</option>
                            <option value="USD" {{ $quote->currency == 'USD' ? 'selected' : '' }}>USD</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Quote Date *</label>
                        <input type="date" name="quote_date" value="{{ $quote->quote_date ? $quote->quote_date->format('Y-m-d') : date('Y-m-d') }}" required class="w-full border rounded-lg px-4 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Valid Until</label>
                        <input type="date" name="valid_until" value="{{ $quote->valid_until ? $quote->valid_until->format('Y-m-d') : date('Y-m-d', strtotime('+30 days')) }}" class="w-full border rounded-lg px-4 py-2">
                    </div>
                </div>
            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">Items</h2>
                    <button type="button" onclick="addItem()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ Add Item</button>
                </div>
                <table class="w-full" id="itemsTable">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-sm">Product</th>
                            <th class="px-4 py-2 text-left text-sm">Description</th>
                            <th class="px-4 py-2 text-left text-sm w-20">Qty</th>
                            <th class="px-4 py-2 text-left text-sm w-32">Price</th>
                            <th class="px-4 py-2 text-left text-sm w-28">Tax %</th>
                            <th class="w-10"></th>
                        </tr>
                    </thead>
                    <tbody id="itemsBody"></tbody>
                </table>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Notes</label>
                        <textarea name="notes" rows="2" class="w-full border rounded-lg px-4 py-2">{{ $quote->notes }}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Terms</label>
                        <textarea name="terms" rows="2" class="w-full border rounded-lg px-4 py-2">{{ $quote->terms }}</textarea>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Discount</label>
                        <input type="number" name="discount" value="{{ $quote->discount }}" min="0" step="0.01" class="w-full border rounded-lg px-4 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Discount Type</label>
                        <select name="discount_type" class="w-full border rounded-lg px-4 py-2">
                            <option value="0" {{ $quote->discount_type == 0 ? 'selected' : '' }}>Fixed</option>
                            <option value="1" {{ $quote->discount_type == 1 ? 'selected' : '' }}>Percentage</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Tax Rate (%)</label>
                        <input type="number" name="tax_rate" value="{{ $quote->tax_rate }}" min="0" max="100" step="0.01" class="w-full border rounded-lg px-4 py-2">
                    </div>
                </div>
            </div>

            <div class="flex justify-end">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">Update Quote</button>
            </div>
        </form>
    </div>

    <script>
        let idx = 0;
        const products = @json($products);
        const existingItems = @json($quote->items ?? []);
        
        function addItem(item = null) {
            const tbody = document.getElementById('itemsBody');
            const row = document.createElement('tr');
            row.className = 'border-b';
            
            let productSelect = `<select name="items[${idx}][product_id]" class="w-full border rounded px-2 py-1" onchange="fillProduct(this)"><option value="">Select</option>`;
            products.forEach(p => {
                const selected = item && item.product_id == p.id ? 'selected' : '';
                productSelect += `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}" data-tax="${p.tax_rate}" ${selected}>${p.name}</option>`;
            });
            productSelect += `</select>`;
            
            row.innerHTML = `
                <td class="px-4 py-2">${productSelect}</td>
                <td class="px-4 py-2"><input type="text" name="items[${idx}][description]" value="${item ? item.description.replace(/"/g, '&quot;') : ''}" class="w-full border rounded px-2 py-1" required></td>
                <td class="px-4 py-2"><input type="number" name="items[${idx}][quantity]" value="${item ? item.quantity : '1'}" min="0.01" step="0.01" class="w-full border rounded px-2 py-1"></td>
                <td class="px-4 py-2"><input type="number" name="items[${idx}][unit_price]" value="${item ? item.unit_price : '0'}" min="0" step="0.01" class="w-full border rounded px-2 py-1"></td>
                <td class="px-4 py-2"><input type="number" name="items[${idx}][tax_rate]" value="${item ? item.tax_rate : '0'}" min="0" max="100" step="0.01" class="w-full border rounded px-2 py-1"></td>
                <td class="px-4 py-2"><button type="button" onclick="this.closest('tr').remove()" class="text-red-600">✕</button></td>
            `;
            tbody.appendChild(row);
            idx++;
        }
        
        function fillProduct(sel) {
            const opt = sel.options[sel.selectedIndex];
            const row = sel.closest('tr');
            if (opt.value) {
                row.querySelector('input[name*="[description]"]').value = opt.dataset.name;
                row.querySelector('input[name*="[unit_price]"]').value = opt.dataset.price;
                row.querySelector('input[name*="[tax_rate]"]').value = opt.dataset.tax;
            }
        }
        
        // Pre-fill existing items
        existingItems.forEach(item => addItem(item));
    </script>
</x-app-layout>
            </div>