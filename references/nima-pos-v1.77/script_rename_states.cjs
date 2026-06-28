const fs = require('fs');

const fixCompProps = (file, replacers) => {
    let data = fs.readFileSync(file, 'utf8');
    for (const [k, v] of replacers) {
        data = data.replaceAll(k, v);
    }
    fs.writeFileSync(file, data);
}

// Behavior
fixCompProps('components/school/behavior/SchoolBehaviorCreateModal.tsx', [
    ['handleSubmit', 'handleCreate'],
    ['formData', 'form'],
    ['setFormData', 'setForm'],
    ['../../types', '../../../types']
]);
fixCompProps('pages/school/SchoolBehavior.tsx', [
    ['handleSubmit={handleSubmit}', 'handleCreate={handleCreate}'],
    ['formData={formData}', 'form={form}'],
    ['setFormData={setFormData}', 'setForm={setForm}']
]);

// Withdrawals
fixCompProps('components/school/withdrawals/SchoolWithdrawalModal.tsx', [
    ['handleSubmit', 'handleCreate'],
    ['formData', 'form'],
    ['setFormData', 'setForm'],
    ['../../types', '../../../types']
]);
fixCompProps('pages/school/SchoolWithdrawals.tsx', [
    ['handleSubmit={handleSubmit}', 'handleCreate={handleCreate}'],
    ['formData={formData}', 'form={form}'],
    ['setFormData={setFormData}', 'setForm={setForm}']
]);

// Pickup
fixCompProps('pages/school/SchoolSecurePickup.tsx', [
    ['pickupPin={pickupPin}', 'pickupPin={pin}'],
    ['setPickupPin={setPickupPin}', 'setPickupPin={setPin}'],
    ['handlePickupSubmit={handlePickupSubmit}', 'handleLogPickup={handleLogPickup}'],
    ['handleAuthPersonSubmit={handleAuthPersonSubmit}', 'handleAddAuthPerson={handleAddAuthPerson}'],
    ['newAuthPerson={newAuthPerson}', 'authForm={authForm}'],
    ['setNewAuthPerson={setNewAuthPerson}', 'setAuthForm={setAuthForm}'],
    ['handleRemoveAuthPerson={handleRemoveAuthPerson}', 'handleDeleteAuthPerson={handleDeleteAuthPerson}']
]);
fixCompProps('components/school/pickup/SchoolPickupModal.tsx', [
    ['../../types', '../../../types'],
    ['pickupPin', 'pin'],
    ['setPickupPin', 'setPin'],
    ['handlePickupSubmit', 'handleLogPickup']
]);
fixCompProps('components/school/pickup/SchoolManageAuthModal.tsx', [
    ['../../types', '../../../types'],
    ['newAuthPerson', 'authForm'],
    ['setNewAuthPerson', 'setAuthForm'],
    ['handleAuthPersonSubmit', 'handleAddAuthPerson'],
    ['handleRemoveAuthPerson', 'handleDeleteAuthPerson']
]);

// Transport ... need to see. For now just these.
console.log('done fixing rename states');
