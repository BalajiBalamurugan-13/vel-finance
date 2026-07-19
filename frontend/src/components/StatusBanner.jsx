function StatusBanner({ status }) {
  const online = status === "online";

  return (
    <div
      className={`
        rounded-xl
        px-4
        py-3
        lg:p-4
        font-medium
        text-sm
        lg:text-base
        ${
          online
            ? "bg-green-900/40 text-green-400"
            : "bg-red-900/40 text-red-400"
        }
      `}
    >
      {online ? "🟢 Online Mode" : "🔴 Offline Mode"}
    </div>
  );
}

export default StatusBanner;