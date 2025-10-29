export default function HomePage() {
  return (
    <section>
      <h2>Welcome to Raven</h2>
      <p>This is the web app frontend. API base: <code>{process.env.NEXT_PUBLIC_API_URL}</code></p>
    </section>
  );
}
