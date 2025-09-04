import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                💰 AutoAccountant
              </h1>
            </div>
            <nav className="flex space-x-8">
              <Link 
                href="/connect" 
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Connect Accounts
              </Link>
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Smart Financial Management
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Connect your financial accounts, track transactions, and gain insights into your spending patterns with our modern accounting platform.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/connect"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                🔗
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Secure Account Connection
              </h3>
              <p className="text-gray-600">
                Connect your bank accounts, credit cards, and investment accounts securely through Plaid's industry-leading platform.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                📊
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Real-time Analytics
              </h3>
              <p className="text-gray-600">
                Get instant insights into your spending patterns, categorize transactions, and track your financial goals.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                🔔
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Smart Notifications
              </h3>
              <p className="text-gray-600">
                Receive real-time alerts for new transactions and stay on top of your finances with customizable notifications.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
