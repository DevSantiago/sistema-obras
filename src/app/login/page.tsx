import { LoginForm } from "@/components/auth/LoginForm";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Sistema de gestión</p>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.description}>
            Ingrese sus credenciales para acceder al sistema.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}