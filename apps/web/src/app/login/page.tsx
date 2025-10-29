export default function LoginPage() {
  return (
    <section>
      <h2>Login</h2>
      <form>
        <input type="email" placeholder="Email" required /><br />
        <input type="password" placeholder="Password" required /><br />
        <button type="submit">Login</button>
      </form>
    </section>
  );
}
