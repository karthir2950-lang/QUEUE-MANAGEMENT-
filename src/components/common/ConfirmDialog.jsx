import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'primary' }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        {confirmVariant === 'danger' && (
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <div>
          <p className="text-slate-600">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
