export default function Dictionaries() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">My Dictionaries</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors">
                    <span className="text-4xl mb-2">+</span>
                    <span className="font-medium">Create New Dictionary</span>
                </div>
            </div>
        </div>
    );
}
