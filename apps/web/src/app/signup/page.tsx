export default function SignupPage() {
  return (
    <section>
      <h2>Sign Up</h2>
      <form>
        <input type="email" placeholder="Email" required /><br />
        <input type="password" placeholder="Password" required /><br />
        <label><input type="checkbox" required /> Accept Terms</label><br />
        <button type="submit">Create Account</button>
      </form>
    </section>
  );
}
