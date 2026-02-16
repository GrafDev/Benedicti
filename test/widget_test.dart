import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:benedict/src/app.dart';
import 'package:benedict/src/localization/generated/app_localizations.dart';
import 'package:benedict/src/routing/app_router.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

// Since we can't easily mock Firebase.initializeApp without heavy boilerplate/plugins
// and our MyApp doesn't actually DEPEND on Firebase being initialized for UI rendering
// (authentication state comes from Riverpod, which we can override),
// we will test MyApp by overriding the router and localization if needed,
// OR just pump MyApp directly since it's a ConsumerWidget.
//
// However, MyApp's build method doesn't access Firebase directly.
// The main() function does, but we are pumping MyApp(), not running main().
//
// Issues might arise if GoRouter redirects based on Auth State which depends on Firebase.
// But currently our GoRouter is simple.

void main() {
  testWidgets('App launches and shows Home Screen', (
    WidgetTester tester,
  ) async {
    // Build our app and trigger a frame.
    // We wrap in ProviderScope.
    await tester.pumpWidget(const ProviderScope(child: MyApp()));

    // Wait for localizations to load
    await tester.pumpAndSettle();

    // Verify that our welcome text is present.
    expect(find.text('Welcome to BeneDict'), findsOneWidget);
    expect(find.text('BeneDict'), findsOneWidget);
  });
}
