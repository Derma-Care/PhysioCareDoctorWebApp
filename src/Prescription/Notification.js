import { useState } from "react";

export default function NotificationDemo() {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    } else {
      alert("This browser does not support notifications.");
    }
  };

  const showNotification = () => {
    if (permission === "granted") {
      new Notification("Hello from React!", {
        body: "This is a native system notification 🚀",
        icon: "https://cdn-icons-png.flaticon.com/512/906/906341.png", // optional icon
      });
    } else {
      alert("Please allow notifications first.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h2 className="text-xl font-bold">React Notifications Demo</h2>
      <button
        onClick={requestPermission}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow"
      >
        Request Permission
      </button>
      <button
        onClick={showNotification}
        className="px-4 py-2 bg-green-500 text-white rounded-lg shadow"
      >
        Show Notification
      </button>
      <p className="text-gray-600">Current permission: {permission}</p>
    </div>
  );
}
