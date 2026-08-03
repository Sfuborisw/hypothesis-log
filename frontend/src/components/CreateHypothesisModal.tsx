import { Modal } from "./Modal";
import { LogHypothesisForm } from "./LogHypothesisForm";
import type { Signal } from "../types";

interface Props {
  signals: Signal[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateHypothesisModal({ signals, onClose, onCreated }: Props) {
  return (
    <Modal title="Log a hypothesis" onClose={onClose}>
      {(close) => (
        <LogHypothesisForm
          signals={signals}
          onCreated={() => {
            onCreated(); // refresh lists + analytics
            close(); // animated close
          }}
        />
      )}
    </Modal>
  );
}
