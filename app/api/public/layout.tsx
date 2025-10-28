export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section style={{ padding: 40 }}>
      <h1>Welcome to My App</h1>
      {children}
    </section>
  );
}
