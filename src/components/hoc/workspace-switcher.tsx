// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { useTranslations } from "next-intl";

import { useAppSession } from "@/components/providers/session-provider";
import { useWorkspaceSwitch } from "@/hooks/use-workspace-switch";
import { workspacesOf } from "@/lib/workspaces";

type SwitcherProps = {
  itemClassName: string;
  onSwitched?: () => void;
};

/**
 * Menu items for switching workspaces, for an account that can open more than one (an ODTÜ student who is also on
 * a startup team, a research assistant). Renders nothing otherwise. Lane S's student and academician frames can
 * place it in their own account menus.
 */
export function WorkspaceSwitcher(props: SwitcherProps) {
  const session = useAppSession();
  if (!session || workspacesOf(session).length < 2) return null;
  return <WorkspaceItems {...props} />;
}

function WorkspaceItems({ itemClassName, onSwitched }: SwitcherProps) {
  const t = useTranslations("workspaceSwitch");
  const { workspaces, active, isSwitching, switchTo } = useWorkspaceSwitch();

  return (
    <div role="group" aria-label={t("label")}>
      <p className="px-4 pt-2.5 text-[11px] font-semibold uppercase text-[#858c96]">
        {t("label")}
      </p>
      {workspaces.map((workspace) => (
        <button
          key={workspace}
          type="button"
          role="menuitemradio"
          aria-checked={workspace === active}
          tabIndex={-1}
          disabled={isSwitching}
          onClick={() => {
            switchTo(workspace);
            onSwitched?.();
          }}
          className={itemClassName}
        >
          <span aria-hidden className="w-4 text-center">
            {workspace === active ? "✓" : ""}
          </span>
          {t(`names.${workspace}`)}
        </button>
      ))}
      <div role="separator" className="mt-1 h-px bg-[#eceef0]" />
    </div>
  );
}
