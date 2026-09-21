import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface DraftCardProps {
  draftTitle?: string;
  onResume?: () => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({
  draftTitle = 'Bay 7 Forklift Cle',
  onResume
}) => {
  return (
    <div
      style={{
        backgroundColor: '#D6E8EA',
        borderRadius: '16px',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        border: '1px solid #BDC9C7',
        boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
        {/* Warning Amber Circle Icon */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#FEF3C7',
            color: '#F0A51A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={22} strokeWidth={2.5} />
        </div>

        {/* Text Container */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#40515A',
              textTransform: 'uppercase'
            }}
          >
            DRAFT IN PROGRESS
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#111C24',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: '2px'
            }}
          >
            {draftTitle}
          </div>
        </div>
      </div>

      {/* Dark Action Pill Button */}
      <button
        onClick={onResume}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#111C24',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '0.04em',
          flexShrink: 0,
          minHeight: '48px',
          cursor: 'pointer',
          transition: 'background-color 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1B2A33';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#111C24';
        }}
      >
        RESUME <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};
