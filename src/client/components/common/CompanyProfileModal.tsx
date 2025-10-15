import React, { useEffect, useRef } from 'react';

interface CompanyProfileModalProps {
  symbol: string;
  name: string;
  show: boolean;
  onHide: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  symbol,
  name,
  show,
  onHide,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && modalRef.current) {
      const modal = new (window as any).bootstrap.Modal(modalRef.current);
      modal.show();

      // Load TradingView widget when modal is shown
      if (widgetContainerRef.current && symbol) {
        loadTradingViewWidget(symbol);
      }

      // Handle modal hide event
      const handleHidden = () => onHide();
      modalRef.current.addEventListener('hidden.bs.modal', handleHidden);

      return () => {
        modal.hide();
        modalRef.current?.removeEventListener('hidden.bs.modal', handleHidden);
      };
    }
  }, [show, symbol, onHide]);

  const loadTradingViewWidget = (tickerSymbol: string) => {
    if (!widgetContainerRef.current) return;

    // Clear existing widget
    widgetContainerRef.current.innerHTML = '';

    // Create new widget container
    const container = document.createElement('div');
    container.className = 'tradingview-widget-container';
    container.style.height = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '100%',
      isTransparent: false,
      colorTheme: 'dark',
      symbol: tickerSymbol,
      locale: 'en'
    });

    container.appendChild(script);
    widgetContainerRef.current.appendChild(container);
  };

  return (
    <div
      ref={modalRef}
      className="modal fade"
      id="companyProfileModal"
      tabIndex={-1}
      aria-labelledby="companyProfileModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content company-profile-modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="companyProfileModalLabel">
              {name ? `${name} - Company Profile` : 'Company Profile'}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ flex: 1, overflow: 'hidden' }}>
            <div ref={widgetContainerRef} style={{ height: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
