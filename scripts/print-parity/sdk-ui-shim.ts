// Substitui "@venore/plugin-sdk/ui" no bundle da regressão de impressão: só o que o relatório usa,
// vindo direto do core (a barrel real arrasta server-only e page-builder, que não rodam num
// navegador de teste). O alias "@core" aponta para venore-docks/src (configurado em run.mjs).
export { cn } from "@core/lib/utils";
export * from "@core/components/ui/button";
export * from "@core/components/ui/dialog";
export * from "@core/components/ui/card";
export * from "@core/components/ui/input";
export * from "@core/components/ui/progress";
export * from "@core/components/ui/chart";
