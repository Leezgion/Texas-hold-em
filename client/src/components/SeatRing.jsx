import React from 'react';

import SeatCard from './SeatCard';

const SeatRing = ({ seats = [], roomState, gameState, gameStarted, geometryContract = null }) => {
  const tableProfile = geometryContract?.tableSurfaceLayout?.profile || seats[0]?.position?.profile || 'desktop-oval';

  return (
    <div
      className="arena-seat-ring absolute inset-0 z-20"
      data-table-profile={tableProfile}
      data-seat-visual-role="embedded-plaque"
    >
      {seats.map((seat) => (
        <SeatCard
          key={seat.anchorSlotId || `seat-${seat.seatIndex}`}
          seat={seat}
          tableProfile={tableProfile}
          roomState={roomState}
          gameState={gameState}
          gameStarted={gameStarted}
        />
      ))}
    </div>
  );
};

export default SeatRing;
