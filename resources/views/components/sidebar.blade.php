<nav class="bg-slate-800 h-screen w-64 fixed left-0 top-0 overflow-y-auto">
    <div class="p-4">
        <a href="{{ route('dashboard') }}" class="flex items-center space-x-2 text-white text-xl font-bold mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Invoice App</span>
        </a>

        <ul class="space-y-1">
            <!-- Dashboard -->
            <li>
                <a href="{{ route('dashboard') }}"
                   class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('dashboard') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Dashboard</span>
                </a>
            </li>

            <!-- Sales Section -->
            <li class="pt-4">
                <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sales</p>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('quotes.index') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('quotes.*') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Quotes</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('invoices.index') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('invoices.*') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Invoices</span>
                        </a>
                    </li>
                </ul>
            </li>

            <!-- Customers -->
            <li class="pt-4">
                <a href="{{ route('customers.index') }}"
                   class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('customers.*') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Customers</span>
                </a>
            </li>
</li>

            <!-- Products Section -->
            <li class="pt-4">
                <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Products</p>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('products.index') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('products.*') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>Products</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('subscriptions.index') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('subscriptions.*') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Subscriptions</span>
                        </a>
                    </li>
                </ul>
            </li>

            <!-- Payments -->
            <li class="pt-4">
                <a href="{{ route('payments.index') }}"
                   class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('payments.*') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Payments</span>
                </a>
            </li>

            <!-- Reports -->
            <li class="pt-4">
                <a href="{{ route('reports.index') }}"
                   class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('reports.*') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Reports</span>
                </a>
            </li>
</li>

            <!-- Settings Section -->
            <li class="pt-4">
                <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Settings</p>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('settings.company') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('settings.company') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Company</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('settings.invoice') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('settings.invoice') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Invoice</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('settings.templates') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('settings.templates') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                            <span>Templates</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('settings.email') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('settings.email') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>Email</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('settings.users') }}"
                           class="flex items-center space-x-3 px-4 py-2.5 rounded-lg {{ request()->routeIs('settings.users') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white' }} transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>Users</span>
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</nav>