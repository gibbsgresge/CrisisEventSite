export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-foreground">Unauthorized</h1>
      <p className="text-gray-500">
        You do not have permission to view this page.
      </p>
    </div>
  );
}
