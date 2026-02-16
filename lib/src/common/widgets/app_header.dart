import 'package:benedict/src/localization/generated/app_localizations.dart';
import 'package:benedict/src/localization/locale_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';

class AppHeader extends ConsumerWidget implements PreferredSizeWidget {
  const AppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = AppLocalizations.of(context)!;
    final currentLocale = ref.watch(localeControllerProvider);

    return AppBar(
      title: InkWell(onTap: () => context.go('/'), child: Text(loc.appTitle)),
      actions: [
        TextButton(
          onPressed: () => context.go('/dictionaries'),
          child: Text(loc.navDictionaries),
        ),
        const Gap(8),
        TextButton(
          onPressed: () => context.go('/login'),
          child: Text(loc.navLogin),
        ),
        TextButton(
          onPressed: () => context.go('/register'),
          child: Text(loc.navRegister),
        ),
        const Gap(16),
        DropdownButton<Locale>(
          value: currentLocale,
          underline: const SizedBox(),
          icon: const Icon(Icons.language),
          onChanged: (Locale? newLocale) {
            if (newLocale != null) {
              ref.read(localeControllerProvider.notifier).setLocale(newLocale);
            }
          },
          items: [
            DropdownMenuItem(
              value: const Locale('en'),
              child: Text(loc.languageEnglish),
            ),
            DropdownMenuItem(
              value: const Locale('ru'),
              child: Text(loc.languageRussian),
            ),
          ],
        ),
        const Gap(16),
      ],
    );
  }
}
