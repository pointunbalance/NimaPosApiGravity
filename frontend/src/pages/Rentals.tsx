import React from 'react';

// Refactored components, hooks, and helpers
import { RentalHeader } from '../components/rentals/RentalHeader';
import { RentalToolbar } from '../components/rentals/RentalToolbar';
import { RentalList } from '../components/rentals/RentalList';
import { RentalCalendar } from '../components/rentals/RentalCalendar';
import { RentalItemModal } from '../components/rentals/RentalItemModal';
import { RentalBookingModal } from '../components/rentals/RentalBookingModal';
import { RentalReturnModal } from '../components/rentals/RentalReturnModal';
import { RentalItemsList } from '../components/rentals/RentalItemsList';
import { StatsCards } from '../components/rentals/StatsCards';
import { sendWhatsApp } from '../components/rentals/rentalUtils';
import { useRentalsState } from '../components/rentals/useRentalsState';
import { useToast } from '../context/ToastContext';

const Rentals: React.FC = () => {
  const { success, error: showError } = useToast();

  const {
    isBookingModalOpen,
    setIsBookingModalOpen,
    isItemModalOpen,
    setIsItemModalOpen,
    returningRental,
    setReturningRental,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    editingRental,
    rentalForm,
    setRentalForm,
    itemForm,
    setItemForm,
    partInput,
    setPartInput,
    editingItemId,
    rentalItems,
    customers,
    stats,
    daysInMonth,
    monthName,
    changeMonth,
    getRentalsForDay,
    filteredRentalsList,
    handleDayClick,
    handleEditRental,
    handleEditItem,
    handleMainImageUpload,
    handleGalleryImageUpload,
    removeGalleryImage,
    addPart,
    removePart,
    handleIDUpload,
    handleGenerateBarcode,
    formatCurrency,
    getStatusColor,
    getStatusLabel,
    handleGenerateSamples,
    handleSaveRental,
    changeStatus,
    handleConfirmReturn,
    handleDeleteRental,
    handleDeleteItem,
    handleSaveItem,
    handlePrintContract,
  } = useRentalsState(success, showError);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal']">
      <RentalHeader
        onAddItem={() => {
          setItemForm({
            name: '',
            price: 0,
            costPrice: 0,
            category: 'بدل رجالي',
            stock: 1,
            image: '',
            images: [],
            parts: [],
            barcode: '',
            size: '',
            color: '',
            description: '',
          });
          setIsItemModalOpen(true);
        }}
        onNewBooking={() => handleDayClick(new Date().getDate())}
      />

      <StatsCards stats={stats} formatCurrency={formatCurrency} />

      <RentalToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {viewMode === 'list' && (
        <RentalList
          rentals={filteredRentalsList}
          formatCurrency={formatCurrency}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
          changeStatus={changeStatus}
          printContract={handlePrintContract}
          sendWhatsApp={sendWhatsApp}
          handleEditRental={handleEditRental}
        />
      )}

      {viewMode === 'calendar' && (
        <RentalCalendar
          monthName={monthName}
          changeMonth={changeMonth}
          daysInMonth={daysInMonth}
          getRentalsForDay={getRentalsForDay}
          handleDayClick={handleDayClick}
          handleEditRental={handleEditRental}
        />
      )}

      {viewMode === 'items' && (
        <RentalItemsList
          items={rentalItems || []}
          formatCurrency={formatCurrency}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onGenerateSamples={handleGenerateSamples}
          onBook={(item) => {
            setRentalForm({
              customerId: 0,
              customerName: '',
              productId: item.id!,
              productName: item.name,
              customerIDFront: '',
              customerIDBack: '',
              bookingDate: new Date(),
              pickupDate: new Date(),
              returnDate: new Date(new Date().setDate(new Date().getDate() + 3)),
              status: 'reserved',
              price: item.price,
              deposit: item.costPrice * 0.1 || 0,
              size: (item as any).size || '',
              notes: '',
            });
            setIsBookingModalOpen(true);
          }}
        />
      )}

      {isItemModalOpen && (
        <RentalItemModal
          itemForm={itemForm}
          setItemForm={setItemForm}
          setIsItemModalOpen={setIsItemModalOpen}
          handleSaveItem={handleSaveItem}
          handleMainImageUpload={handleMainImageUpload}
          handleGalleryImageUpload={handleGalleryImageUpload}
          removeGalleryImage={removeGalleryImage}
          partInput={partInput}
          setPartInput={setPartInput}
          addPart={addPart}
          removePart={removePart}
          generateBarcode={handleGenerateBarcode}
          isEditing={!editingItemId}
        />
      )}

      {isBookingModalOpen && (
        <RentalBookingModal
          editingRental={editingRental}
          setIsBookingModalOpen={setIsBookingModalOpen}
          rentalForm={rentalForm}
          setRentalForm={setRentalForm}
          rentalItems={rentalItems}
          customers={customers}
          handleIDUpload={handleIDUpload}
          handleSaveRental={handleSaveRental}
          printContract={handlePrintContract}
          handleDeleteRental={handleDeleteRental}
        />
      )}

      {returningRental && (
        <RentalReturnModal
          rental={returningRental}
          onClose={() => setReturningRental(null)}
          onConfirm={handleConfirmReturn}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default Rentals;
