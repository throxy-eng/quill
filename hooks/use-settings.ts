import { useEffect, useState } from "react";
import { default_settings, load_settings, save_settings, type Settings } from "@/lib/storage";

export function use_settings() {
  const [settings, set_settings] = useState<Settings>(default_settings);
  const [is_ready, set_is_ready] = useState(false);

  useEffect(() => {
    set_settings(load_settings());
    set_is_ready(true);
  }, []);

  function update_settings(patch: Partial<Settings>) {
    set_settings((current) => {
      const next = { ...current, ...patch };
      save_settings(next);
      return next;
    });
  }

  return { settings, is_ready, update_settings };
}
