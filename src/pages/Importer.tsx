import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Download, CheckCircle, Loader2, Home } from 'lucide-react';
import { ref, get, push, set as dbSet } from 'firebase/database';
import { db } from '../firebase';

const FULL_WORD_LIST = [
 { original: "recently", translation: "недавно" },
 { original: "smuggle", translation: "возить контрабандой" },
 { original: "turn out", translation: "оказывается" },
 { original: "potion", translation: "зелье" },
 { original: "follower", translation: "последователь" },
 { original: "lately", translation: "в последнее время" },
 { original: "TV-show", translation: "сериал" },
 { original: "severance", translation: "разрыв" },
 { original: "accessible", translation: "доступный" },
 { original: "variety", translation: "разнообразие" },
 { original: "more", translation: "больше" },
 { original: "remind", translation: "напоминать" },
 { original: "allow", translation: "позволить" },
 { original: "loud", translation: "громкий" },
 { original: "scream", translation: "кричать" },
 { original: "shout", translation: "орать" },
 { original: "go to work", translation: "ехать на работу" },
 { original: "euthanasia", translation: "усыпление" },
 { original: "belong to", translation: "принадлежать кому-то" },
 { original: "the same", translation: "такой же" },
 { original: "outside", translation: "наружу" },
 { original: "rest", translation: "отдых, отдыхать" },
 { original: "boring", translation: "скучный" },
 { original: "wake up", translation: "будить, просыпаться" },
 { original: "wash", translation: "умываться" },
 { original: "then", translation: "потом" },
 { original: "go for a walk", translation: "идти гулять" },
 { original: "with", translation: "с" },
 { original: "in the evening", translation: "вечером" },
 { original: "because", translation: "потому что" },
 { original: "complain", translation: "жаловаться" },
 { original: "get out of bed", translation: "вставать с кровати" },
 { original: "cereal", translation: "хлопья" },
 { original: "have to", translation: "вынужден, должен" },
 { original: "contradict", translation: "противоречить" },
 { original: "folder", translation: "папка" },
 { original: "doubt", translation: "сомневаться" },
 { original: "it takes me", translation: "у меня уходит (время)" },
 { original: "groceries", translation: "продукты" },
 { original: "dorm", translation: "общага" },
 { original: "on a hunch", translation: "по наитию" },
 { original: "on a whim", translation: "по блажи" },
 { original: "spoil", translation: "испортить, портиться" },
 { original: "beans", translation: "бобы" },
 { original: "herbs", translation: "травы" },
 { original: "fall", translation: "падать" },
 { original: "gather", translation: "собирать, собираться" },
 { original: "can", translation: "жестяная банка" },
 { original: "jar", translation: "стеклянная банка" },
 { original: "reach", translation: "достигать" },
 { original: "sticky", translation: "липкий" },
 { original: "melt", translation: "плавиться" },
 { original: "It tasted", translation: "на вкус было" },
 { original: "burn", translation: "сжечь" },
 { original: "pot", translation: "кастрюля" },
 { original: "about", translation: "о, об" },
 { original: "after", translation: "после" },
 { original: "heat", translation: "нагревать" },
 { original: "pan", translation: "сковородка" },
 { original: "hiss", translation: "шипеть" },
 { original: "temporary", translation: "временный" },
 { original: "feel each other out", translation: "прощупывать" },
 { original: "accept", translation: "принимать" },
 { original: "befriend someone", translation: "подружиться с кем-то" },
 { original: "make it through", translation: "пережить" },
 { original: "calm", translation: "спокойный" },
 { original: "keep your cool", translation: "оставайся спокойным" },
 { original: "rub", translation: "тереть" },
 { original: "tears", translation: "слезы" },
 { original: "host", translation: "ведущий" },
 { original: "seagull", translation: "чайка" },
 { original: "the most", translation: "больше всего" },
 { original: "inappropriate", translation: "неуместный" },
 { original: "come across", translation: "сталкиваться, пересекаться" },
 { original: "experience", translation: "испытывать" },
 { original: "it depends on", translation: "зависит от" },
 { original: "relevant", translation: "актуальный" },
 { original: "participant", translation: "участник" },
 { original: "turn around", translation: "развернуться" },
 { original: "appropriate", translation: "уместный" },
 { original: "offend", translation: "обидеть" },
 { original: "rarely", translation: "редко" },
 { original: "seldom", translation: "редко" },
 { original: "exchange", translation: "обмениваться" },
 { original: "become", translation: "становится" },
 { original: "based on this", translation: "исходя из этого" },
 { original: "make laugh", translation: "рассмешить" },
 { original: "violate", translation: "нарушать" },
 { original: "similar", translation: "похожий" },
 { original: "stage", translation: "инсценировать" },
 { original: "ribbon", translation: "ленточка" },
 { original: "dumb", translation: "тупой" },
 { original: "throat", translation: "горло" },
 { original: "lungs", translation: "легкие" },
 { original: "antipyretics", translation: "жаропонижающие" },
 { original: "toughen up", translation: "закалятся" },
 { original: "vice versa", translation: "наоборот" },
 { original: "sick leave", translation: "больничный" },
 { original: "chickenpox", translation: "ветрянка" },
 { original: "measles", translation: "корь" },
 { original: "jaundice", translation: "желтуха" },
 { original: "anxious", translation: "тревожный" },
 { original: "sinusitis", translation: "гайморит" },
 { original: "well", translation: "колодец" },
 { original: "bucket", translation: "ведро" },
 { original: "tongue", translation: "язык" },
 { original: "snowflakes", translation: "снежинки" },
 { original: "tires", translation: "шины" },
 { original: "condition", translation: "состояние" },
 { original: "privacy", translation: "уединение, приватность" },
 { original: "thoughts", translation: "мысли" },
 { original: "pantry", translation: "кладовка" },
 { original: "grateful", translation: "благодарный" },
 { original: "furnace", translation: "печка" },
 { original: "fit into", translation: "помещаться в" },
 { original: "torture", translation: "пытка" },
 { original: "It's not worth it", translation: "оно того не стоит" },
 { original: "lower back", translation: "поясница" },
 { original: "purchase", translation: "покупка" },
 { original: "move", translation: "перенести, сдвинуть" },
 { original: "headboard of a bed", translation: "спинка кровати" },
 { original: "tennant", translation: "арендатор" },
 { original: "fragile", translation: "хрупкий" },
 { original: "predict", translation: "предсказать" },
 { original: "leisure", translation: "досуг" },
 { original: "barefoot", translation: "босиком" },
 { original: "household", translation: "быт, бытовой" },
 { original: "to be in the time of need", translation: "быть в трудной ситуации" },
 { original: "trust implicitly", translation: "безоговорочно доверять" },
 { original: "temper", translation: "умерить" },
 { original: "dismissive", translation: "пренебрежительно" },
 { original: "stuffy", translation: "душно, душный" },
 { original: "competitor", translation: "конкурент" },
 { original: "competition", translation: "конкуренция" },
 { original: "pass by me", translation: "проходить мимо" },
 { original: "graduation", translation: "выпускной" },
 { original: "further", translation: "дальше" },
 { original: "confidently", translation: "уверенно" },
 { original: "tip the scales", translation: "перевесить чашу весов" },
 { original: "in my favor", translation: "в мою пользу" },
 { original: "frustrated", translation: "разочарованный" },
 { original: "wrap things up", translation: "свернуться" },
 { original: "to have a hard time doing something", translation: "сложно что-то делать" },
 { original: "put something to use", translation: "воспользоваться чем-то" },
 { original: "let's make a mess", translation: "пойти во все тяжкие" },
 { original: "moron", translation: "баран (оскорбление)" },
 { original: "humble", translation: "приструненный" },
 { original: "bank statement", translation: "банковская выписка" },
 { original: "to be out here", translation: "жить здесь" },
 { original: "go though", translation: "просматривать что-то" },
 { original: "lump", translation: "шишка, опухоль" },
 { original: "angle", translation: "угол обзора" },
 { original: "Are you aware of how hot your mom is?", translation: "ты же в курсе, насколько горяча твоя мама?" },
 { original: "gross", translation: "фу" },
 { original: "on the surface", translation: "на поверхности" },
 { original: "legislative", translation: "юридический" },
 { original: "raise the topic", translation: "поднять тему" },
 { original: "It was very enticing", translation: "это очень подкупало" },
 { original: "cut all ties", translation: "разорвать все связи" },
 { original: "This is the least of my concerns", translation: "это заботит меня меньше всего" },
 { original: "self-esteem", translation: "самооценка" },
 { original: "I could care less", translation: "мне в высшей степени наплевать" },
 { original: "immigration took place at the time of", translation: "моя иммиграция пришлась на время" },
 { original: "cast", translation: "актерский состав" },
 { original: "director", translation: "режиссер" },
 { original: "plot", translation: "сюжет" },
 { original: "script", translation: "сценарий" },
 { original: "set", translation: "съемочная площадка" },
 { original: "stuntman", translation: "каскадер" },
 { original: "keep something to myself", translation: "держать в себе" },
 { original: "reevaluate", translation: "переосмыслить" },
 { original: "relief", translation: "облегчение" },
 { original: "figuratively", translation: "фигурально" },
 { original: "empathize", translation: "сопереживать" },
 { original: "insincerely", translation: "неискренно" },
 { original: "break the ground", translation: "открыть Америку" },
 { original: "absorb", translation: "усваивать" },
 { original: "deceive", translation: "обмануть" },
 { original: "strong bond", translation: "близкая связь" },
 { original: "grudge", translation: "обида" },
 { original: "insidious", translation: "коварный" },
 { original: "lawnmower", translation: "газонокосилка" },
 { original: "ancient", translation: "древний" },
 { original: "stray dogs", translation: "бродячие собаки" },
 { original: "by-products", translation: "субпродукты" },
 { original: "film", translation: "пленка" },
 { original: "itchy", translation: "чешется" },
 { original: "resist temptation", translation: "бороться с соблазном" },
 { original: "wrist", translation: "запястье" },
 { original: "capricious", translation: "капризный" },
 { original: "smear", translation: "размазывать" },
 { original: "pile", translation: "заваливать" },
 { original: "to be bias towards", translation: "быть предвзятым" },
 { original: "shy", translation: "робкий" },
 { original: "order", translation: "порядок" },
 { original: "timetable", translation: "расписание" },
 { original: "to be late", translation: "опаздывать" },
 { original: "headmaster", translation: "директор (школьный)" },
 { original: "grill bbq", translation: "жарить шашлыки" },
 { original: "despite", translation: "несмотря на" },
 { original: "mop", translation: "швабра" },
 { original: "threaten", translation: "угрожать" },
 { original: "fire arms", translation: "оружие" },
 { original: "sight", translation: "взгляд / место / достопримечательность" },
 { original: "site", translation: "сайт / место раскопок / место" },
 { original: "mould", translation: "плесень" },
 { original: "Spot", translation: "пятно" },
 { original: "measurements", translation: "измерения" },
 { original: "liquor", translation: "спирт" },
 { original: "liqueur", translation: "ликер" },
 { original: "infusions", translation: "настойки" },
 { original: "spirit drinks", translation: "алкоголь" },
 { original: "among", translation: "среди" },
 { original: "gut feeling", translation: "нутро" },
 { original: "step over", translation: "перешагнуть" },
 { original: "children slide", translation: "горка" },
 { original: "roll", translation: "катиться" },
 { original: "school reunion", translation: "встреча выпускников" },
 { original: "railway tracks", translation: "ж/д пути" },
 { original: "anxiety", translation: "тревожность" },
 { original: "mediocre", translation: "посредственный" },
 { original: "insult", translation: "оскорбить" },
 { original: "highlight", translation: "выделять" },
 { original: "invent", translation: "изобретать" },
 { original: "food poisoning", translation: "отравление" },
 { original: "to feel off guard", translation: "быть не в своей тарелке" },
 { original: "stammer", translation: "запинаться" },
 { original: "companion", translation: "собеседник" },
 { original: "counter-part", translation: "собеседник" },
 { original: "appearance", translation: "внешний вид" },
 { original: "increase", translation: "повышать" },
 { original: "unconsciously", translation: "неосознанно" },
 { original: "raise my voice", translation: "повышать голос" },
 { original: "lose my cool", translation: "выходить из себя" },
 { original: "inhuman", translation: "бесчеловечный" },
 { original: "digest", translation: "переваривать" },
 { original: "get rid of", translation: "избавляться от" },
 { original: "sip", translation: "глоток" },
 { original: "drumsticks", translation: "куриные ножки" },
 { original: "paws", translation: "лапы" },
 { original: "horse raddish", translation: "хрен" },
 { original: "aspic", translation: "студень" },
 { original: "heat treatment", translation: "термообработка" },
 { original: "joint", translation: "забегаловка" },
 { original: "intentionally", translation: "целенаправленно" },
 { original: "overrate", translation: "переоценить" },
 { original: "underrate", translation: "недооценить" },
 { original: "stall", translation: "киоск" },
 { original: "mash", translation: "толочь" },
 { original: "dough", translation: "тесто" },
 { original: "crepe", translation: "блин" },
 { original: "whim", translation: "блажь" },
 { original: "steamer", translation: "пароварка" },
 { original: "purchase", translation: "покупка" },
 { original: "lid", translation: "крышка" },
 { original: "I see no reason", translation: "я не вижу причины" },
 { original: "humidifier", translation: "увлажнитель" },
 { original: "clipper", translation: "машинка для стрижки" },
 { original: "grind", translation: "перемалывать" },
 { original: "treadmill", translation: "беговая дорожка" },
 { original: "recent", translation: "недавний" },
 { original: "emergent", translation: "срочно" },
 { original: "earn", translation: "зарабатывать" },
 { original: "accumulated", translation: "накопленный" },
 { original: "transparent", translation: "прозрачный" },
 { original: "fulfill", translation: "реализовать" },
 { original: "materialize", translation: "реализовать" },
 { original: "at wish", translation: "по желанию" },
 { original: "appear", translation: "появиться" },
 { original: "thought", translation: "мысль" },
 { original: "brick", translation: "кирпич" },
 { original: "wire", translation: "провод" },
 { original: "winding", translation: "обмотка" },
 { original: "source", translation: "источник" },
 { original: "sore throat", translation: "больное горло" },
 { original: "to be delirious", translation: "быть в бреду" },
 { original: "skip", translation: "пропускать" },
 { original: "bother", translation: "отвлекать" },
 { original: "get to someone", translation: "докопаться" },
 { original: "pester", translation: "доебаться" },
 { original: "eloquence", translation: "красноречие" },
 { original: "twitch", translation: "дергаться" },
 { original: "micro stroke", translation: "микроинсульт" },
 { original: "headache", translation: "головная боль" },
 { original: "trigeminal nerve", translation: "тройничный нерв" },
 { original: "blood pressure", translation: "давление" },
 { original: "too", translation: "тоже" },
 { original: "as well", translation: "также" },
 { original: "set up", translation: "подставить" },
 { original: "issue", translation: "издание" },
 { original: "weigh", translation: "взвешивать" },
 { original: "immerse", translation: "погружаться" },
 { original: "entire", translation: "целый" },
 { original: "stick around", translation: "ошиваться" },
 { original: "reiterate", translation: "повторить детально" },
 { original: "tell the difference", translation: "разница" },
 { original: "to be due", translation: "пора возвращать" },
 { original: "prey", translation: "охотиться" },
 { original: "tickle the pickle", translation: "будоражить" },
 { original: "to be equipped", translation: "быть оборудованным" },
 { original: "record player", translation: "проигрыватель пластинок" },
 { original: "reject", translation: "отринуть" },
 { original: "monk", translation: "монах" },
 { original: "comprehend", translation: "постигать" },
 { original: "semi-finished products", translation: "полуфабрикаты" },
 { original: "semis", translation: "полуфабрикаты" },
 { original: "replace", translation: "заменять" },
 { original: "going to", translation: "собираться что-то делать" },
 { original: "till", translation: "до момента" },
 { original: "direct", translation: "прямой" },
 { original: "turned off", translation: "выключенный" },
 { original: "humidity", translation: "влажность" },
 { original: "get tanned", translation: "загореть" },
 { original: "expel", translation: "отчислять" },
 { original: "treatment", translation: "лечение" },
 { original: "punctual", translation: "пунктуальный" },
 { original: "equipment", translation: "оборудование" },
 { original: "to be surrounded by", translation: "быть окруженным" },
 { original: "glacier", translation: "ледник" },
 { original: "cable car", translation: "фуникулер" },
 { original: "funicular", translation: "фуникулер" },
 { original: "cliff", translation: "утес, обрыв" },
 { original: "turn signal", translation: "поворотник" },
 { original: "for a long time", translation: "долгое время" },
 { original: "raw", translation: "сырой" },
 { original: "to be missing", translation: "не хватать" },
 { original: "embassy", translation: "посольство" },
 { original: "see off", translation: "провожать" },
 { original: "accompany", translation: "сопроводить" },
 { original: "guilty", translation: "виноватый" },
 { original: "blame", translation: "винить" },
 { original: "punishment", translation: "наказание" },
 { original: "to be hard on yourself", translation: "истязать себя" },
 { original: "bark", translation: "гавкать" },
 { original: "drown", translation: "утопить" },
 { original: "unpredictable", translation: "непредсказуемый" },
 { original: "only a handful of", translation: "всего лишь горстка" },
 { original: "cliche", translation: "клише" },
 { original: "pathetic", translation: "жалкий" },
 { original: "conscious", translation: "осознанный" },
 { original: "conscience", translation: "совесть" },
 { original: "fed up", translation: "сытым по горло" },
 { original: "mute", translation: "немой" },
 { original: "bronchitis", translation: "бронхит" },
 { original: "borrowed time", translation: "вопрос времени" },
 { original: "have feelings", translation: "испытывать чувства" },
 { original: "puppeteer", translation: "кукловод" },
 { original: "loyal", translation: "преданный" },
 { original: "humiliate", translation: "унижать" },
 { original: "sacrifice", translation: "жертвовать" },
 { original: "between the rock and a hard place", translation: "между молотом и наковальней" },
 { original: "competition", translation: "конкуренция" },
 { original: "compete", translation: "соревноваться" },
 { original: "unwind", translation: "сильно расслабиться" },
 { original: "common language", translation: "общий язык" },
 { original: "spend", translation: "тратить время/деньги" },
 { original: "waste", translation: "тратить впустую" },
 { original: "entity", translation: "сущность" },
 { original: "assault", translation: "нападение, насилие" },
 { original: "egotistical", translation: "эгоистичный" },
 { original: "impressions", translation: "впечатления" },
 { original: "box office", translation: "прокат" },
 { original: "universe", translation: "вселенная" },
 { original: "flood", translation: "затопить" },
 { original: "tap", translation: "кран" },
 { original: "riser", translation: "стояк" },
 { original: "socket", translation: "розетка" },
 { original: "plug", translation: "вилка" },
 { original: "unscrew the hose", translation: "открутить шланг" },
 { original: "for pennies", translation: "за копейки" },
 { original: "retire", translation: "выйти на пенсию" },
 { original: "generally", translation: "в общем" },
 { original: "height", translation: "рост" },
 { original: "regular", translation: "постоянный" },
 { original: "work permit", translation: "разрешение на работу" },
 { original: "border", translation: "граница" },
 { original: "consider", translation: "рассматривать" },
 { original: "real estate", translation: "недвижимость" },
 { original: "chew", translation: "жевать" },
 { original: "chiropractor", translation: "остеопат" },
 { original: "make a decision", translation: "принять решение" },
 { original: "improve", translation: "улучшить" },
 { original: "compared to", translation: "в сравнении" },
 { original: "scholarship", translation: "стипендия" },
 { original: "stipend", translation: "стипендия" },
 { original: "enclosure", translation: "вольер" },
 { original: "self-awareness", translation: "самоосознанность" },
 { original: "fucking exhausted", translation: "крайне заебанный" },
 { original: "in a hurry", translation: "торопиться" },
 { original: "obedient", translation: "послушный" },
 { original: "obey", translation: "подчиняться" },
 { original: "revoke", translation: "аннулировать" },
 { original: "shady", translation: "незаконный" },
 { original: "tool", translation: "инструмент" },
 { original: "live by the rules", translation: "жить по правилам" },
 { original: "get tense", translation: "напрягаться" },
 { original: "sooner or later", translation: "рано или поздно" },
 { original: "among", translation: "среди" },
 { original: "come up with", translation: "придумать что-то" },
 { original: "anyway", translation: "все равно" },
 { original: "nausea", translation: "тошнота" },
 { original: "vomit", translation: "блевать" },
 { original: "puke", translation: "блевать" },
 { original: "throw up", translation: "блевать" },
 { original: "lactose intolerant", translation: "непереносимость лактозы" },
 { original: "inconvenient", translation: "неудобно" },
 { original: "fall asleep", translation: "засыпать" },
 { original: "blindfold", translation: "повязка на глаза" },
 { original: "gap", translation: "щель" },
 { original: "origins", translation: "происхождение" },
 { original: "similar", translation: "похожий" },
 { original: "curse word", translation: "мат" },
 { original: "youth", translation: "молодежь" },
 { original: "unfazed", translation: "невозмутимый" },
 { original: "mountain out of a molehill", translation: "делать из мухи слона" },
 { original: "make a fuss", translation: "раздувать шумиху" },
 { original: "CamRip", translation: "экранка" },
 { original: "ENT", translation: "ЛОР" },
 { original: "prescription", translation: "рецепт" },
 { original: "prescribe", translation: "выписывать рецепт" },
 { original: "weasely", translation: "хитрый" },
 { original: "get used to", translation: "привыкать" },
 { original: "it seemed", translation: "казалось" },
 { original: "distance", translation: "расстояние" },
 { original: "pace", translation: "ритм" },
 { original: "cozy", translation: "уютный" },
 { original: "tired of", translation: "устать от" },
 { original: "decrease", translation: "снижаться" },
 { original: "flat", translation: "плоский" },
 { original: "ancient", translation: "древний" },
 { original: "various", translation: "разнообразный" },
 { original: "closer", translation: "ближе" },
 { original: "mountains", translation: "горы" },
 { original: "landscape", translation: "ландшафт" },
 { original: "snow", translation: "снег" },
 { original: "degree", translation: "градус" },
 { original: "Moscow region", translation: "Подмосковье" },
 { original: "vacation", translation: "отпуск" },
 { original: "entertainment", translation: "развлечение" },
 { original: "district", translation: "район" },
 { original: "demand", translation: "требование" },
 { original: "delivery", translation: "доставка" },
 { original: "pick-up point", translation: "пункт выдачи" }
];

export default function Importer() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-15), msg]);

    const cleanTranslation = (text: string) => {
        if (!text) return '';
        // 1. Remove [everything here]
        // 2. Double ;; to single ;
        // 3. Compact spaces
        return text
            .replace(/\[.*?\]/g, '')
            .replace(/;;/g, ';')
            .replace(/\s\s+/g, ' ')
            .trim();
    };

    const runImport = async () => {
        if (!currentUser) {
            addLog("Error: No user found. Please login.");
            return;
        }

        setStatus('running');
        addLog("Starting ULTIMATE import for 'DESER'...");

        try {
            const dictsRef = ref(db, `users/${currentUser.uid}/dictionaries`);
            const snapshot = await get(dictsRef);
            
            let dictId = '';
            let existingWords: string[] = [];
            
            if (snapshot.exists()) {
                const dicts = snapshot.val();
                const existing = Object.entries(dicts).find(([_, d]: any) => d.name === "DESER");
                if (existing) {
                    dictId = existing[0];
                    addLog("Found 'DESER'. Fetching existing words...");
                    const wordsSnap = await get(ref(db, `users/${currentUser.uid}/dictionaries/${dictId}/words`));
                    if (wordsSnap.exists()) {
                        existingWords = Object.values(wordsSnap.val()).map((w: any) => w.original.toLowerCase().trim());
                    }
                }
            }

            if (!dictId) {
                addLog("Creating new 'DESER' dictionary...");
                const newDictRef = push(dictsRef);
                await dbSet(newDictRef, {
                    name: "DESER",
                    sourceLang: "en",
                    targetLang: "ru",
                    wordCount: 0,
                    createdAt: Date.now()
                });
                dictId = newDictRef.key!;
            }

            addLog(`Analyzing ${FULL_WORD_LIST.length} words...`);

            const wordsRefPath = `users/${currentUser.uid}/dictionaries/${dictId}/words`;
            let addedCount = 0;
            let skippedCount = 0;

            for (let i = 0; i < FULL_WORD_LIST.length; i++) {
                const w = FULL_WORD_LIST[i];
                const cleanOrig = w.original.toLowerCase().trim();
                
                if (existingWords.includes(cleanOrig)) {
                    skippedCount++;
                } else {
                    const newWordRef = push(ref(db, wordsRefPath));
                    await dbSet(newWordRef, {
                        original: w.original,
                        translation: cleanTranslation(w.translation),
                        box: 0,
                        nextReview: Date.now(),
                        createdAt: Date.now()
                    });
                    addedCount++;
                    existingWords.push(cleanOrig);
                }
                
                setProgress(Math.round(((i + 1) / FULL_WORD_LIST.length) * 100));
                if (i % 25 === 0) addLog(`Checked ${i + 1} words...`);
            }

            await dbSet(ref(db, `users/${currentUser.uid}/dictionaries/${dictId}/wordCount`), existingWords.length);

            addLog(`✅ SUCCESS! Added: ${addedCount}, Skipped: ${skippedCount}. Total: ${existingWords.length}`);
            setStatus('done');
        } catch (error: any) {
            addLog(`❌ ERROR: ${error.message}`);
            setStatus('error');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '100px auto', padding: '2rem', background: '#1e293b', borderRadius: '1rem', color: '#f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download color="#fde047" /> Ultimate Importer: DESER v3.2
            </h1>
            
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                Версия БЕЗ ЦЕНЗУРЫ. Полный список (~500 позиций).
            </p>

            {status === 'idle' && (
                <button 
                    onClick={runImport}
                    style={{ width: '100%', padding: '1rem', background: '#fde047', color: '#713f12', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                    Запустить Импорт
                </button>
            )}

            {status !== 'idle' && (
                <div>
                    <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#fde047', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fde047', fontSize: '0.9rem' }}>
                        {status === 'running' ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} 
                        {status === 'running' ? `Обработка... ${progress}%` : 'Готово!'}
                    </div>
                </div>
            )}

            {status === 'done' && (
                <button 
                    onClick={() => navigate('/games')}
                    style={{ width: '100%', marginTop: '2rem', padding: '0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Home size={18} /> К играм
                </button>
            )}

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#0f172a', borderRadius: '0.5rem', fontSize: '0.8rem', fontFamily: 'monospace', opacity: 0.8, maxHeight: '200px', overflowY: 'auto' }}>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}
