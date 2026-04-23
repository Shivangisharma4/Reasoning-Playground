"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { LazyMotion, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const convex = convexUrl
  ? new ConvexReactClient(convexUrl, { unsavedChangesWarning: false })
  : null;

// ─── Design tokens (keep in sync with theme.css) ────────────────────────────
const T = {
  ink:     "#0a0a0b",
  slate:   "#141417",
  slate2:  "#1c1c20",
  paper:   "#f2ede4",
  bone:    "#8b8680",
  bone2:   "#5a5651",
  acid:    "#c6ff3d",
  acidDim: "#9ecc2d",
  border:  "rgba(242,237,228,0.08)",
  border2: "rgba(242,237,228,0.12)",
};

const clerkAppearance = {
  variables: {
    colorPrimary:         T.acid,
    colorBackground:      T.ink,
    colorText:            T.paper,
    colorTextSecondary:   T.bone,
    colorInputBackground: T.slate,
    colorInputText:       T.paper,
    colorNeutral:         T.paper,
    colorDanger:          "#ff4d3a",
    borderRadius:         "8px",
    fontFamily:           "var(--font-instrument), ui-sans-serif, system-ui",
    fontFamilyButtons:    "var(--font-jetbrains), ui-monospace, monospace",
    fontSize:             "14px",
  },
  elements: {
    // ── Card / shell ───────────────────────────────────────────
    card: {
      style: {
        background: "transparent",
        boxShadow: "none",
        padding: 0,
      },
    },
    rootBox: { style: { width: "100%" } },
    cardBox: {
      style: {
        background: "transparent",
        boxShadow: "none",
        width: "100%",
      },
    },

    // ── Header ─────────────────────────────────────────────────
    headerTitle:    { style: { display: "none" } },
    headerSubtitle: { style: { display: "none" } },

    // ── Social buttons ─────────────────────────────────────────
    socialButtonsBlockButton: {
      style: {
        background: T.slate,
        border: `1px solid ${T.border}`,
        color: T.paper,
        borderRadius: "8px",
        fontSize: "13px",
        transition: "border-color 0.15s",
      },
    },
    socialButtonsBlockButtonText: {
      style: { color: T.paper, fontSize: "13px" },
    },

    // ── Divider ────────────────────────────────────────────────
    dividerLine: { style: { background: T.border } },
    dividerText: { style: { color: T.bone2, fontSize: "11px" } },

    // ── Form fields ────────────────────────────────────────────
    formFieldLabel: {
      style: { color: T.bone, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" },
    },
    formFieldInput: {
      style: {
        background: T.slate,
        border: `1px solid ${T.border2}`,
        color: T.paper,
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
      },
    },
    formFieldHintText: { style: { color: T.bone2 } },
    formFieldErrorText: { style: { color: "#ff4d3a", fontSize: "12px" } },

    // ── Buttons ────────────────────────────────────────────────
    formButtonPrimary: {
      style: {
        background: T.acid,
        color: T.ink,
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        borderRadius: "8px",
        border: "none",
        transition: "background 0.15s",
      },
    },
    formButtonReset: {
      style: { color: T.bone, fontSize: "12px" },
    },

    // ── Links & footer ─────────────────────────────────────────
    footerAction: {
      style: { color: T.bone2, fontSize: "13px" },
    },
    footerActionLink: {
      style: { color: T.acid, fontWeight: 500 },
    },
    footerPages: {
      style: { background: "transparent" },
    },

    // ── OTP / verification ─────────────────────────────────────
    otpCodeFieldInput: {
      style: {
        background: T.slate,
        border: `1px solid ${T.border2}`,
        color: T.paper,
        borderRadius: "8px",
      },
    },

    // ── Alerts ─────────────────────────────────────────────────
    alert: {
      style: {
        background: T.slate2,
        border: `1px solid ${T.border}`,
        color: T.paper,
        borderRadius: "8px",
      },
    },
    alertText: { style: { color: T.paper } },

    // ── UserButton popup ───────────────────────────────────────
    userButtonTrigger: {
      style: { outline: "none", borderRadius: "50%" },
    },
    userButtonPopoverCard: {
      style: {
        background: T.slate,
        border: `1px solid ${T.border}`,
        borderRadius: "12px",
        boxShadow: `0 20px 60px -10px rgba(0,0,0,0.9), 0 0 0 1px ${T.border}`,
        padding: "6px",
      },
    },
    userButtonPopoverActions: {
      style: { padding: "4px 0" },
    },
    userButtonPopoverActionButton: {
      style: {
        color: T.paper,
        borderRadius: "8px",
        fontSize: "13px",
        padding: "8px 12px",
        transition: "background 0.1s",
      },
    },
    userButtonPopoverActionButtonText: {
      style: { color: T.paper, fontSize: "13px" },
    },
    userButtonPopoverActionButtonIcon: {
      style: { color: T.bone },
    },
    userButtonPopoverFooter: {
      style: {
        borderTop: `1px solid ${T.border}`,
        marginTop: "6px",
        paddingTop: "6px",
      },
    },
    userButtonAvatarBox: {
      style: { width: "32px", height: "32px" },
    },

    // ── User profile modal ─────────────────────────────────────
    modalContent: {
      style: {
        background: T.slate,
        border: `1px solid ${T.border}`,
        borderRadius: "16px",
        color: T.paper,
      },
    },
    profileSectionTitle: {
      style: { color: T.paper, borderBottom: `1px solid ${T.border}` },
    },
    profileSectionTitleText: {
      style: { color: T.paper, fontWeight: 500 },
    },
    navbarButton: {
      style: { color: T.bone, borderRadius: "6px" },
    },
    navbarButtonIcon: { style: { color: T.bone } },
  },
};

export function Providers({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    );
  }
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <LazyMotion features={domAnimation} strict>
          {children}
        </LazyMotion>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
