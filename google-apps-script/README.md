# Synchronizacja listy zadań

## Konfiguracja Google Sheets

1. Utwórz arkusz Google. Skopiuj jego identyfikator z adresu pomiędzy `/d/` i `/edit`.
2. Otwórz [Google Apps Script](https://script.google.com/) i utwórz nowy projekt.
3. Wklej zawartość pliku `Code.gs` do edytora skryptów.
4. Ustaw `SPREADSHEET_ID` na identyfikator arkusza. Zmień `ACCESS_TOKEN` na długi, losowy ciąg znaków i zachowaj go w tajemnicy.
5. Uruchom funkcję `setupTasksSheet` w edytorze i zaakceptuj prośbę o dostęp do arkusza.
6. Wybierz **Wdróż → Nowe wdrożenie → Aplikacja internetowa**. Ustaw uruchamianie jako swoje konto Google i dostęp dla każdego. Aplikacja sprawdza token, zanim odczyta lub zmieni zadania.
7. Wdróż skrypt i skopiuj adres aplikacji kończący się na `/exec`.
8. W aplikacji otwórz **Ustawienia**. Wklej adres i ten sam token w polach synchronizacji zadań; zrób to na każdym urządzeniu.

Po zmianie kodu skryptu opublikuj nową wersję wdrożenia. Używaj listy wyłącznie w zaufanych aplikacjach: token jest przechowywany w przeglądarce i wysyłany do skryptu, więc osoba, która go pozna, może odczytywać i zmieniać listę. To rozwiązanie jest przeznaczone do prywatnego demo, nie do przechowywania poufnych danych.

## Jak działa synchronizacja

Zadania są od razu zapisywane lokalnie, a następnie wysyłane do arkusza. Lista jest pobierana przy uruchomieniu, przy użyciu przycisku synchronizacji i automatycznie co 30 sekund. Jeśli arkusz jest pusty, istniejąca lokalna lista zostanie do niego przeniesiona; w przeciwnym razie arkusz jest źródłem listy na nowym urządzeniu. Bez konfiguracji aplikacja nadal działa lokalnie.
