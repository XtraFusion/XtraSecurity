{/* Inside your main page.tsx */}
{/* Replace the existing table section with: */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow">
  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
      Environment Variables & Secrets
    </h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Manage environment variables and secrets for the {selectedBranch} branch
    </p>
  </div>
  
  <div className="p-6">
    {filteredSecrets.length > 0 ? (
      <SecretsTable
        secrets={filteredSecrets}
        visibleSecrets={visibleSecrets}
        copiedSecret={copiedSecret}
        onToggleVisibility={toggleSecretVisibility}
        onCopy={copyToClipboard}
        onEdit={(secret) => {
          setEditingSecret(secret);
          setIsEditSecretOpen(true);
        }}
        onViewHistory={(secret) => {
          setHistorySecret(secret);
          setIsHistoryModalOpen(true);
        }}
        onDelete={handleDeleteSecret}
        getEnvironmentColor={getEnvironmentColor}
        formatDate={formatDate}
      />
    ) : (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          {searchQuery
            ? "No secrets found matching your search."
            : "No secrets in this branch yet."}
        </div>
        {!searchQuery && (
          <Button onClick={() => setIsAddSecretOpen(true)}>
            Add your first secret
          </Button>
        )}
      </div>
    )}
  </div>
</div>

{/* Edit Secret Dialog */}
<Dialog
  isOpen={isEditSecretOpen}
  onClose={() => {
    setIsEditSecretOpen(false);
    setTimeout(() => setEditingSecret(null), 0);
  }}
  title="Edit Secret"
  description="Update the secret value and description."
>
  {editingSecret && (
    <div className="space-y-4">
      <Input
        label="Key"
        value={editingSecret.key}
        onChange={(e) =>
          setEditingSecret({
            ...editingSecret,
            key: e.target.value,
          })
        }
      />
      
      <Textarea
        label="Value"
        value={editingSecret.value}
        onChange={(e) =>
          setEditingSecret({
            ...editingSecret,
            value: e.target.value,
          })
        }
      />
      
      <Input
        label="Description"
        value={editingSecret.description}
        onChange={(e) =>
          setEditingSecret({
            ...editingSecret,
            description: e.target.value,
          })
        }
      />
      
      <Select
        label="Environment"
        value={editingSecret.environment_type}
        onChange={(e) =>
          setEditingSecret({
            ...editingSecret,
            environment_type: e.target.value as any,
          })
        }
        options={[
          { value: 'development', label: 'Development' },
          { value: 'staging', label: 'Staging' },
          { value: 'production', label: 'Production' },
        ]}
      />
      
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={() => {
            setIsEditSecretOpen(false);
            setEditingSecret(null);
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            handleEditSecret();
            setIsEditSecretOpen(false);
            setEditingSecret(null);
          }}
        >
          Update Secret
        </Button>
      </div>
    </div>
  )}
</Dialog>

{/* Add Secret Dialog - Similar structure to Edit Dialog */}
<Dialog
  isOpen={isAddSecretOpen}
  onClose={() => setIsAddSecretOpen(false)}
  title="Add New Secret"
  description={`Add a new environment variable or secret to ${selectedBranch} branch.`}
>
  <div className="space-y-4">
    <Input
      label="Key"
      placeholder="e.g., DATABASE_URL"
      value={newSecret.key}
      onChange={(e) =>
        setNewSecret({ ...newSecret, key: e.target.value })
      }
    />
    
    <Textarea
      label="Value"
      placeholder="Enter the secret value"
      value={newSecret.value}
      onChange={(e) =>
        setNewSecret({ ...newSecret, value: e.target.value })
      }
    />
    
    <Input
      label="Type"
      placeholder="e.g., API_KEY"
      value={newSecret.type}
      onChange={(e) =>
        setNewSecret({ ...newSecret, type: e.target.value })
      }
    />
    
    <Input
      label="Description"
      placeholder="Brief description of this secret"
      value={newSecret.description}
      onChange={(e) =>
        setNewSecret({ ...newSecret, description: e.target.value })
      }
    />
    
    <Select
      label="Environment"
      value={newSecret.environment_type}
      onChange={(e) =>
        setNewSecret({
          ...newSecret,
          environment_type: e.target.value as any,
        })
      }
      options={[
        { value: 'development', label: 'Development' },
        { value: 'staging', label: 'Staging' },
        { value: 'production', label: 'Production' },
      ]}
    />
    
    <Input
      label="Permissions"
      placeholder="user@example.com, admin@example.com"
      value={newSecret.permission.join(", ")}
      onChange={(e) =>
        setNewSecret({
          ...newSecret,
          permission: e.target.value
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean),
        })
      }
    />
    
    <Input
      type="datetime-local"
      label="Expiry Date"
      value={newSecret.expiryDate}
      onChange={(e) =>
        setNewSecret({
          ...newSecret,
          expiryDate: e.target.value,
        })
      }
    />
    
    <Select
      label="Rotation Policy"
      value={newSecret.rotationPolicy}
      onChange={(e) =>
        setNewSecret({
          ...newSecret,
          rotationPolicy: e.target.value,
        })
      }
      options={[
        { value: 'manual', label: 'Manual' },
        { value: 'auto', label: 'Automatic' },
        { value: 'interval', label: 'Interval-based' },
      ]}
    />
    
    <div className="flex justify-end gap-3 mt-6">
      <Button
        variant="secondary"
        onClick={() => setIsAddSecretOpen(false)}
      >
        Cancel
      </Button>
      <Button onClick={handleAddSecret}>
        Add Secret
      </Button>
    </div>
  </div>
</Dialog>
