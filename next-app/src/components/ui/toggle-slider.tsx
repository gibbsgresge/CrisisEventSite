"use client";
import { useState } from "react";

interface ToggleProps {
  onChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
}

export default function Toggle({
  onChange,
  defaultChecked = false,
}: ToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const toggle = () => {
    setChecked((prev) => {
      const newState = !prev;
      onChange?.(newState);
      return newState;
    });
  };

  return (
    <button
      onClick={toggle}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}
