import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold mb-6 text-center">Demo Resto — Accueil</h1>
      <div className="grid gap-3 max-w-sm mx-auto">
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Vitrines clients</p>
        <Link href="/snack" className="block bg-white border rounded-lg p-4 text-sm font-medium hover:bg-gray-50">Chez Tatie Monique (snack)</Link>
        <Link href="/restaurant" className="block bg-white border rounded-lg p-4 text-sm font-medium hover:bg-gray-50">Le Quotidien Péi (restaurant)</Link>
        <Link href="/pizzeria" className="block bg-white border rounded-lg p-4 text-sm font-medium hover:bg-gray-50">Pizza Lé Bon (pizzeria)</Link>
        <Link href="/foodtruck" className="block bg-white border rounded-lg p-4 text-sm font-medium hover:bg-gray-50">Dodo on the Road (food truck)</Link>
        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mt-4">Back-office</p>
        <Link href="/dashboard" className="block bg-white border rounded-lg p-4 text-sm font-medium hover:bg-gray-50">Dashboard restaurateur</Link>
        <Link href="/whatsapp" className="block bg-white border rounded-lg p-4 text-sm font-medium hover:bg-gray-50">Simulation WhatsApp</Link>
        <Link href="/ticket" className="block bg-white border rounded-lg p-4 text-sm font-medium hover:bg-gray-50">Ticket thermique</Link>
      </div>
    </main>
  );
}
