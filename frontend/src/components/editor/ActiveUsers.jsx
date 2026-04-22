const ActiveUsers = ({ users }) => {
  if (!users || users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {users.slice(0, 5).map((user, index) => (
        <div
          key={user.id}
          title={user.name}
          style={{
            backgroundColor: user.color,
            marginLeft: index > 0 ? "-6px" : "0",
            zIndex: users.length - index,
          }}
          className="
            w-7 h-7 rounded-full
            flex items-center justify-center
            text-white text-xs font-semibold
            border-2 border-white dark:border-gray-900
            relative cursor-default
            transition-transform hover:scale-110 hover:z-50
          "
        >
          {user.name?.[0]?.toUpperCase() || "?"}
        </div>
      ))}
      {users.length > 5 && (
        <div className="
          w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600
          flex items-center justify-center
          text-gray-600 dark:text-gray-300
          text-xs font-semibold
          border-2 border-white dark:border-gray-900
          ml-[-6px]
        ">
          +{users.length - 5}
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;