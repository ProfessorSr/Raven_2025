import Link from 'next/link';

export default function AdminHome() {
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <h1>Admin</h1>
      <ul>
        <li><Link href="/admin/forms">Form Fields</Link></li>
      </ul>
    </main>
  );
}
