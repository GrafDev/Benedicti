import 'package:benedict/src/features/authentication/data/auth_repository.dart';
import 'package:benedict/src/app.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

// Simple mock for AuthRepository
class MockAuthRepository implements AuthRepository {
  @override
  Stream<User?> authStateChanges() {
    return Stream.value(null); // Emit null (not logged in)
  }

  @override
  User? get currentUser => null;

  @override
  Future<void> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {}

  @override
  Future<void> createUserWithEmailAndPassword(
    String email,
    String password,
  ) async {}

  @override
  Future<void> signOut() async {}
}

void main() {
  testWidgets('App launches and shows Home Screen', (
    WidgetTester tester,
  ) async {
    // Override the authRepositoryProvider to use our mock
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authRepositoryProvider.overrideWith((ref) => MockAuthRepository()),
        ],
        child: const MyApp(),
      ),
    );

    // Wait for localizations and router
    await tester.pumpAndSettle();

    // Verify that our welcome text is present.
    expect(find.text('Welcome to BeneDict'), findsOneWidget);
    expect(find.text('BeneDict'), findsOneWidget);
  });
}
