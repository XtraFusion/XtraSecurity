// 'use client';

// // import { useAuth } from '@/hooks/useAuth';
// import { signOut } from 'next-auth/react';

// export default function UserProfile() {
//   const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center p-4">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return (
//       <div className="p-4 text-center">
//         <p className="text-red-500">Please sign in to view this content</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 space-y-4">
//       <div className="flex items-center space-x-4">
//         {user?.image && (
//           <img
//             src={user.image}
//             alt={user.name || 'Profile'}
//             className="w-12 h-12 rounded-full"
//           />
//         )}
//         <div>
//           <h2 className="text-xl font-bold">{user?.name}</h2>
//           <p className="text-gray-600">{user?.email}</p>
//           <p className="text-sm text-gray-500">Role: {user?.role}</p>
//         </div>
//       </div>

//       {isAdmin && (
//         <div className="bg-yellow-50 p-4 rounded">
//           <p className="text-yellow-800">You have admin privileges</p>
//         </div>
//       )}

//       <button
//         onClick={() => signOut()}
//         className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
//       >
//         Sign Out
//       </button>
//     </div>
//   );
// }

import React from 'react'

const Userp = () => {
  return (
    <div>
      
    </div>
  )
}

export default Userp
