import { Secret } from '../types';
import { Eye, EyeOff, Copy, Check, MoreHorizontal, Edit, History, Trash2 } from 'lucide-react';

interface SecretsTableProps {
  secrets: Secret[];
  visibleSecrets: Set<string>;
  copiedSecret: string | null;
  onToggleVisibility: (id: string) => void;
  onCopy: (value: string, id: string) => void;
  onEdit: (secret: Secret) => void;
  onViewHistory: (secret: Secret) => void;
  onDelete: (id: string) => void;
  getEnvironmentColor: (env: string) => string;
  formatDate: (date: string) => string;
}

export function SecretsTable({
  secrets,
  visibleSecrets,
  copiedSecret,
  onToggleVisibility,
  onCopy,
  onEdit,
  onViewHistory,
  onDelete,
  getEnvironmentColor,
  formatDate,
}: SecretsTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Key</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Value</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Environment</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Last Updated</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {secrets.map((secret) => (
            <tr key={secret.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 font-mono font-medium">{secret.key}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm max-w-xs truncate">
                    {visibleSecrets.has(secret.id) ? secret.value : "••••••••"}
                  </code>
                  <button
                    onClick={() => onToggleVisibility(secret.id)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {visibleSecrets.has(secret.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onCopy(secret.value, secret.id)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedSecret === secret.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnvironmentColor(secret.environment_type)}`}>
                  {secret.environment_type}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                <div>
                  <div>{formatDate(secret.lastUpdated)}</div>
                  <div className="text-xs">by {secret.updatedBy}</div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="relative inline-block text-left group">
                  <button
                    onClick={(e) => {
                      const menu = e.currentTarget.nextElementSibling;
                      menu?.classList.toggle('hidden');
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  <div className="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => onEdit(secret)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => onViewHistory(secret)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <History className="mr-2 h-4 w-4" />
                        View History
                      </button>
                      <button
                        onClick={() => onDelete(secret.id)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
