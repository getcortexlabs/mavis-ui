#import <XCTest/XCTest.h>
#import <XCUIAutomation/XCUIAutomation.h>

@interface Audit : XCTestCase
@property (nonatomic, strong) XCUIApplication *app;
@property (nonatomic, strong) XCUIVoiceOverService *voice;
@property (nonatomic) BOOL checkInsertedStatus;
@end

@implementation Audit
- (void)capture:(NSString *)name {
  XCTAttachment *attachment = [XCTAttachment attachmentWithScreenshot:self.app.screenshot];
  attachment.name = name;
  attachment.lifetime = XCTAttachmentLifetimeKeepAlways;
  [self addAttachment:attachment];
}

- (NSString *)moveTo:(NSString *)label {
  NSError *error = nil;
  NSString *current = [self.voice currentSpeechAndReturnError:&error].utterance;
  if ([current hasPrefix:label]) return current;
  NSString *previous = nil;
  int repeated = 0;
  for (int i = 0; i < 30; i++) {
    XCUIVoiceOverOutput *output = [self.voice moveForwardAndReturnError:&error];
    XCTAssertNotNil(output, @"%@", error);
    NSLog(@"MAVIS_VOICEOVER %@", output.utterance);
    XCTAssertFalse([output.utterance containsString:@"✦"]);
    XCTAssertFalse([output.utterance containsString:@"Uma ação no cartão inteiro"]);
    XCTAssertFalse([output.utterance containsString:@"Título e descrição"]);
    if ([output.utterance hasPrefix:label]) return output.utterance;
    repeated = [previous isEqualToString:output.utterance] ? repeated + 1 : 0;
    if (repeated == 2) break;
    previous = output.utterance;
  }
  XCTFail(@"VoiceOver did not reach %@", label);
  return @"";
}

- (void)activate:(NSString *)label {
  // Reader traversal can return before its automatic scroll animation settles.
  CGRect previous = CGRectNull;
  int stable = 0;
  for (int i = 0; i < 20 && stable < 3; i++) {
    CGRect frame = self.app.buttons[label].frame;
    stable = CGRectEqualToRect(frame, previous) ? stable + 1 : 0;
    previous = frame;
    [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  NSLog(@"MAVIS_ACTIVATE %@ %@", label, NSStringFromCGRect(previous));
  [[self.app.buttons[label] coordinateWithNormalizedOffset:CGVectorMake(0.5, 0.5)] doubleTap];
}

- (void)testVoiceOver {
  [self auditThemes:YES];
}

// Keep the page alive to cover removal and recreation of an offscreen Text.
- (void)testRepeatedLoading {
  [self auditThemes:NO];
}

// Separate from the repeated-content regression: UIKit can omit a newly
// inserted offscreen label from traversal during the first loading cycle.
- (void)testInsertedStatus {
  self.checkInsertedStatus = YES;
  [self auditThemes:YES];
}

- (void)auditThemes:(BOOL)separateLaunches {
  self.continueAfterFailure = NO;
  self.app = [[XCUIApplication alloc] initWithBundleIdentifier:@"com.getcortexlabs.mavis.catalog"];
  self.voice = XCUIDevice.sharedDevice.voiceOverService;
  NSError *error = nil;
  BOOL wasEnabled = self.voice.enabled;
  XCTAssertTrue([self.voice enableAndReturnError:&error], @"%@", error);
  @try {
    for (int theme = 0; theme < 2; theme++) {
      if (separateLaunches || theme == 0) [self.app launch];
      if (separateLaunches && theme) {
        [self moveTo:@"Usar tema escuro"];
        [self activate:@"Usar tema escuro"];
        XCTAssertTrue([self.app.buttons[@"Usar tema claro"] waitForExistenceWithTimeout:3]);
        [self.voice moveBackwardAndReturnError:&error];
      }
      NSLog(@"MAVIS_THEME %d", theme);
      [self capture:theme ? @"midnight" : @"mavis"];
      NSString *themeLabel = theme ? @"Usar tema claro" : @"Usar tema escuro";
      [self moveTo:themeLabel];
      XCUIElement *themeButton = self.app.buttons[themeLabel];
      XCTAssertGreaterThanOrEqual(themeButton.frame.size.height, 43.99);
      XCTAssertGreaterThanOrEqual(themeButton.frame.size.width, 43.99);
      [self moveTo:@"Outra tela"];
      [self activate:@"Outra tela"];
      [self moveTo:@"Voltar à acessibilidade"];
      [self activate:@"Voltar à acessibilidade"];
      NSLog(@"MAVIS_RETURN %@", [self.voice currentSpeechAndReturnError:&error].utterance);
      [self moveTo:@"Adicionar favorito"];
      [self activate:@"Adicionar favorito"];
      [self moveTo:[NSString stringWithFormat:@"Favoritos: %d", separateLaunches ? 1 : theme + 1]];
      [self moveTo:@"Temperatura 21 adjustable"];
      XCTAssertGreaterThanOrEqual(self.app.sliders[@"Temperatura"].frame.size.height, 43.99);
      [self.app swipeUp];
      NSString *increased = [self.voice currentSpeechAndReturnError:&error].utterance;
      NSLog(@"MAVIS_INCREMENT %@", increased);
      XCTAssertTrue([increased containsString:@"21.1"]);
      [self.app swipeDown];
      XCTAssertTrue([[self.voice currentSpeechAndReturnError:&error].utterance containsString:@"21"]);
      XCTAssertEqualObjects(self.app.sliders[@"Temperatura"].value, @"21");
      [self moveTo:@"Passo final 1 adjustable"];
      [self.app swipeDown];
      XCTAssertTrue([[self.voice currentSpeechAndReturnError:&error].utterance containsString:@"0.9"]);
      [self.app swipeUp];
      XCTAssertEqualObjects(self.app.sliders[@"Passo final"].value, @"1");
      [self moveTo:@"Ver detalhes"];
      [self capture:theme ? @"midnight-controls" : @"mavis-controls"];
      [self activate:@"Ver detalhes"];
      XCTAssertTrue([self.app.buttons[@"Ocultar detalhes"] waitForExistenceWithTimeout:3]);
      [self moveTo:@"Detalhes disponíveis."];
      [self moveTo:@"Fechar detalhes"];
      [self capture:theme ? @"midnight-reveal" : @"mavis-reveal"];
      [self activate:@"Fechar detalhes"];
      NSPredicate *returned = [NSPredicate predicateWithBlock:^BOOL(id object, NSDictionary *bindings) {
        return [[self.voice currentSpeechAndReturnError:NULL].utterance hasPrefix:@"Ver detalhes"];
      }];
      [self expectationForPredicate:returned evaluatedWithObject:self.voice handler:nil];
      [self waitForExpectationsWithTimeout:4 handler:nil];
      NSString *restored = [self.voice currentSpeechAndReturnError:&error].utterance;
      NSLog(@"MAVIS_REVEAL_RETURN %@", restored);
      XCTAssertTrue([restored hasPrefix:@"Ver detalhes"]);
      [self moveTo:@"Preparar sessão"];
      [self activate:@"Preparar sessão"];
      XCTAssertTrue(self.app.buttons[@"Preparando…"].exists);
      [self.voice moveBackwardAndReturnError:&error];
      NSString *loading = [self moveTo:@"Preparando…"];
      NSLog(@"MAVIS_LOADING %@", loading);
      XCTAssertTrue([loading containsString:@"dimmed"]);
      NSPredicate *enabled = [NSPredicate predicateWithFormat:@"exists == YES AND enabled == YES"];
      [self expectationForPredicate:enabled evaluatedWithObject:self.app.buttons[@"Preparar sessão"] handler:nil];
      [self waitForExpectationsWithTimeout:8 handler:nil];
      [self.voice moveBackwardAndReturnError:&error];
      NSString *ready = [self moveTo:@"Preparar sessão"];
      NSLog(@"MAVIS_READY %@", ready);
      XCTAssertFalse([ready containsString:@"dimmed"]);
      [self capture:theme ? @"midnight-ready" : @"mavis-ready"];
      if (self.checkInsertedStatus || (!separateLaunches && theme)) {
        XCTAssertTrue([self.app.staticTexts[@"Sessão pronta."] waitForExistenceWithTimeout:3]);
        if (self.checkInsertedStatus) {
          [self moveTo:@"Sessão pronta."];
        } else {
          [self.app swipeRight];
          NSString *status = [self.voice currentSpeechAndReturnError:&error].utterance;
          NSLog(@"MAVIS_INSERTED_STATUS %@", status);
          XCTAssertTrue([status hasPrefix:@"Sessão pronta."]);
        }
      }
      [self moveTo:@"Botão indisponível"];
      XCTAssertFalse(self.app.buttons[@"Botão indisponível"].enabled);
      [self moveTo:@"Cartão indisponível"];
      XCTAssertFalse(self.app.buttons[@"Cartão indisponível"].enabled);
      [self moveTo:@"Volume indisponível 25"];
      [self.app swipeUp];
      XCTAssertEqualObjects(self.app.sliders[@"Volume indisponível"].value, @"25");
      if (separateLaunches) {
        [self.app terminate];
      } else if (theme == 0) {
        for (int i = 0; i < 30; i++) {
          NSString *speech = [self.voice moveBackwardAndReturnError:&error].utterance;
          if ([speech hasPrefix:themeLabel]) break;
        }
        [self activate:themeLabel];
        XCTAssertTrue([self.app.buttons[@"Usar tema claro"] waitForExistenceWithTimeout:3]);
        [self.voice moveBackwardAndReturnError:&error];
      }
    }
  } @finally {
    if (!wasEnabled) [self.voice disableAndReturnError:&error];
  }
}
@end
