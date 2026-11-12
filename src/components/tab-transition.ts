// Barrido lateral entre pestañas.
//
// Antes de cambiar de pestaña se guarda la dirección (1 = la nueva entra por la derecha,
// -1 = por la izquierda). La pantalla que recibe el foco la "consume" y anima su entrada
// (ver AppScreen). Lo hacemos así porque el navegador guarda las pestañas en orden alfabético,
// no en el orden visual de la barra, y calcularía mal la dirección.

/** Orden visual de las pestañas en la barra inferior (nombres de archivo en src/app/(app)/). */
export const TAB_ORDER = ['index', 'talleres', 'ninos', 'admin'] as const;
export type TabName = (typeof TAB_ORDER)[number];

let pendingDirection: 1 | -1 | 0 = 0;

/** Registra el cambio de `from` a `to` para que la pantalla destino sepa desde dónde entrar. */
export function prepareTabTransition(from: string | undefined, to: string) {
  const fromIndex = TAB_ORDER.indexOf(from as TabName);
  const toIndex = TAB_ORDER.indexOf(to as TabName);
  pendingDirection = fromIndex < 0 || toIndex < 0 || fromIndex === toIndex ? 0 : toIndex > fromIndex ? 1 : -1;
}

/** Devuelve la dirección pendiente (una sola vez) y la reinicia. */
export function consumeTabTransition() {
  const direction = pendingDirection;
  pendingDirection = 0;
  return direction;
}
