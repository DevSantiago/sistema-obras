"use client";

import type { ReactNode } from "react";
import styles from "./ListSearchPanel.module.css";

type ListSearchPanelProps = {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  children: ReactNode;
};

export function ListSearchPanel({
  title,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  children,
}: ListSearchPanelProps) {
  return (
    <section className={styles.panel}>
      <header className={styles.toolbar}>
        <h2>{title}</h2>
        <label className={styles.searchField}>
          <span>{searchLabel}</span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
      </header>
      {children}
    </section>
  );
}
