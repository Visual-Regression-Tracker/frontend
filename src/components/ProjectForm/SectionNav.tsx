import { useEffect, useRef, useState } from "react";
import { Box, Link, Stack } from "@mui/material";
import { SETTINGS_SECTIONS } from "./ProjectForm";
import { settingsSectionId } from "./SettingsRow";

const ACTIVE_OFFSET = 80;
const SCROLL_SETTLE_MS = 150;

const sectionInView = (main: HTMLElement): string => {
  const atEnd =
    main.scrollHeight > main.clientHeight &&
    main.scrollTop + main.clientHeight >= main.scrollHeight - 2;
  if (atEnd) {
    return SETTINGS_SECTIONS[SETTINGS_SECTIONS.length - 1].id;
  }
  const line = main.getBoundingClientRect().top + ACTIVE_OFFSET;
  const passed = SETTINGS_SECTIONS.filter(
    ({ id }) =>
      (document.getElementById(settingsSectionId(id))?.getBoundingClientRect()
        .top ?? Infinity) <= line,
  );
  return (passed[passed.length - 1] ?? SETTINGS_SECTIONS[0]).id;
};

export const SectionNav = () => {
  const [active, setActive] = useState<string>(SETTINGS_SECTIONS[0].id);
  const navRef = useRef<HTMLElement>(null);
  const settleTimer = useRef<number>(undefined);
  const jumping = useRef(false);

  const holdUntilScrollSettles = () => {
    jumping.current = true;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      jumping.current = false;
    }, SCROLL_SETTLE_MS);
  };

  useEffect(() => {
    const main = navRef.current?.closest("main");
    if (!main) {
      return;
    }
    const follow = () => {
      if (jumping.current) {
        holdUntilScrollSettles();
        return;
      }
      setActive(sectionInView(main));
    };
    main.addEventListener("scroll", follow, { passive: true });
    return () => {
      main.removeEventListener("scroll", follow);
      window.clearTimeout(settleTimer.current);
    };
  }, []);

  return (
    <Box
      ref={navRef}
      component="nav"
      aria-label="Settings sections"
      sx={{ position: { md: "sticky" }, top: { md: 16 }, alignSelf: "start" }}
    >
      <Stack
        direction={{ xs: "row", md: "column" }}
        spacing={{ xs: 2, md: 0.5 }}
      >
        {SETTINGS_SECTIONS.map(({ id, title }) => (
          <Link
            key={id}
            href={`#${settingsSectionId(id)}`}
            underline="none"
            variant="body2"
            aria-current={active === id ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              setActive(id);
              holdUntilScrollSettles();
              document
                .getElementById(settingsSectionId(id))
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            sx={{
              color: active === id ? "primary.main" : "text.secondary",
              fontWeight: active === id ? 600 : undefined,
              py: 0.5,
            }}
          >
            {title}
          </Link>
        ))}
      </Stack>
    </Box>
  );
};
