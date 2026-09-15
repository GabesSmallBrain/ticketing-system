# Five-minute demonstration

**00:00 — Shop.** Open `/`; select **ND Beltinci — NŠ Mura**.

**00:30 — Purchase.** Choose two *Tribuna — Odrasli* tickets, continue, enter any demo name/email, then choose **Plačilo uspešno**.

**01:30 — Tickets.** Open the first QR ticket. On one laptop, copy the opaque QR value only when testing manually (or use a phone QR reader); the ticket visual is ready for phone display.

**02:00 — Gate.** Open `/demo-login`, choose guard, then `/scanner`. Select the match and gate; enter the credential. Show the green valid result, then enter it once more to show duplicate rejection.

**03:00 — Box office.** Sign in as cashier and open `/admin/blagajna`. Choose *Stojišče — Odrasli*, choose **Gotovina**, then print/show the generated ticket. Repeat with **Prodaj + spusti na stadion** to demonstrate immediate admission.

**04:00 — Management.** Sign in as administrator and open `/admin`; explain sales, attendance, remaining expected arrivals and recent activity. Finish with `/sezonske` as an intentional next-stage capability.

For a phone on the same LAN, start with `npm run dev`, identify the laptop IP yourself, and open `http://<local-ip>:3000/scanner`. Do not change firewall settings automatically.
