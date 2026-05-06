import React from 'react';

import SeatCard from './SeatCard';

const SeatRing = ({ seats = [], roomState, gameState, gameStarted, geometryContract = null, hideHeroSeat = false }) => {
  const tableProfile = geometryContract?.tableSurfaceLayout?.profile || seats[0]?.position?.profile || 'desktop-oval';
  const viewportModel = geometryContract?.viewportLayout?.viewportModel || null;
  const hasPhoneHeroSeat = tableProfile === 'phone-oval' && seats.some((seat) => seat.occupied && seat.isCurrentPlayer);
  const hidesPhoneOpenSeats = tableProfile === 'phone-oval' && (gameStarted || hasPhoneHeroSeat);
  const visibleSeats = seats.filter((seat) => {
    if (seat.seatAvailability === 'closed') {
      return false;
    }

    if (hidesPhoneOpenSeats && !seat.occupied) {
      return false;
    }

    return hideHeroSeat ? seat.anchorRole !== 'hero' : true;
  });

  return (
    <div
      className="arena-seat-ring absolute inset-0 z-20"
      data-table-profile={tableProfile}
      data-viewport-model={viewportModel}
      data-seat-visual-role="embedded-plaque"
    >
      {visibleSeats.map((seat) => (
        <SeatCard
          key={seat.anchorSlotId || `seat-${seat.seatIndex}`}
          seat={seat}
          tableProfile={tableProfile}
          roomState={roomState}
          gameState={gameState}
          gameStarted={gameStarted}
          viewportModel={viewportModel}
        />
      ))}
    </div>
  );
};

export default SeatRing;
