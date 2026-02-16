export default function Games() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Learning Games</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Game Card Placeholder */}
                <div className="border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <div className="h-40 bg-blue-100 rounded-lg mb-4 flex items-center justify-center text-4xl">
                        🧩
                    </div>
                    <h2 className="text-xl font-bold mb-2">Flashcards</h2>
                    <p className="text-gray-600 mb-4">Classic review mode with spaced repetition.</p>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
                        Play Now
                    </button>
                </div>

                {/* Game Card Placeholder */}
                <div className="border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow bg-white">
                    <div className="h-40 bg-green-100 rounded-lg mb-4 flex items-center justify-center text-4xl">
                        ⚡️
                    </div>
                    <h2 className="text-xl font-bold mb-2">Word Match</h2>
                    <p className="text-gray-600 mb-4">Race against time to match pairs.</p>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">
                        Play Now
                    </button>
                </div>
            </div>
        </div>
    );
}
