export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrate } = await import("@core/lib/migration");

    await migrate();
  }
}
