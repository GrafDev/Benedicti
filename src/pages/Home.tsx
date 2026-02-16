import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <h1 className="text-4xl font-bold mb-4">Master Any Language</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Build your vocabulary with our smart spaced repetition system and fun interactive games.
            </p>
            <div className="flex gap-4">
                <Link
                    to="/dictionaries"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    My Dictionaries
                </Link>
                <Link
                    to="/games"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                    Play Games
                </Link>
            </div>
        </div>
    );
}
