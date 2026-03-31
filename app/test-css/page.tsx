export default function TestCSS() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-600 text-white p-8 rounded-xl text-center">
        <h1 className="text-2xl font-bold">If you see RED background, Tailwind is working!</h1>
        <p className="mt-4">If this is gray, Tailwind is not loading.</p>
      </div>
    </div>
  )
}