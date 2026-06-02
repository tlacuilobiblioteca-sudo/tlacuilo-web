-- ============================================================
-- SEED VIDEOTECA · primera tanda de VHS
-- 25 títulos identificados del PDF IMG_4074 2.pdf
-- Correr en Supabase SQL Editor
-- ============================================================
-- NOTA: sin portada_url ni descripción aún. Después en /admin/libros
-- puedes hacer click en cada uno y darle "🎬 Autorrellenar con TMDB"
-- que va a jalar portada + descripción + año automático.
-- ============================================================

INSERT INTO public.libros (titulo, autor, anio, teca, formato, disponible) VALUES
  -- ===== Clásicos americanos / Hollywood dorado =====
  ('The Last Laugh',              'F.W. Murnau',          1924, 'videoteca', 'VHS', true),
  ('Cimarron',                    'Wesley Ruggles',       1931, 'videoteca', 'VHS', true),
  ('Sabotage',                    'Alfred Hitchcock',     1936, 'videoteca', 'VHS', true),
  ('Rebecca',                     'Alfred Hitchcock',     1940, 'videoteca', 'VHS', true),
  ('Drums Along the Mohawk',      'John Ford',            1939, 'videoteca', 'VHS', true),
  ('The Adventures of Robin Hood','Michael Curtiz',       1938, 'videoteca', 'VHS', true),
  ('The Nazis Strike',            'Frank Capra',          1943, 'videoteca', 'VHS', true),
  ('Key Largo',                   'John Huston',          1948, 'videoteca', 'VHS', true),
  ('Wuthering Heights',           'William Wyler',        1939, 'videoteca', 'VHS', true),
  ('Dodsworth',                   'William Wyler',        1936, 'videoteca', 'VHS', true),
  ('Dead End',                    'William Wyler',        1937, 'videoteca', 'VHS', true),
  ('Island of Lost Souls',        'Erle C. Kenton',       1932, 'videoteca', 'VHS', true),
  ('The Pink Panther',            'Blake Edwards',        1963, 'videoteca', 'VHS', true),
  ('The Last Temptation of Christ','Martin Scorsese',     1988, 'videoteca', 'VHS', true),
  ('Hour of the Wolf',            'Ingmar Bergman',       1968, 'videoteca', 'VHS', true),
  ('World War II: Nuremberg Trials', NULL,                NULL, 'videoteca', 'VHS', true),

  -- ===== Serie Civilizaciones Perdidas · Time-Life folio (documentales) =====
  ('Civilizaciones Perdidas: Egipto en busca de la inmortalidad I',  'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Egipto en busca de la inmortalidad II', 'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Roma el último imperio I',              'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Roma el último imperio II',             'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Incas el secreto de los ancestros I',   'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Incas el secreto de los ancestros II',  'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Grecia el esplendor de la Grecia Clásica I',  'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Grecia el esplendor de la Grecia Clásica II', 'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: China I',                               'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: China II Las grandes dinastías',        'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Africa historia negada I',              'Time-Life', NULL, 'videoteca', 'VHS', true),
  ('Civilizaciones Perdidas: Africa historia negada II',             'Time-Life', NULL, 'videoteca', 'VHS', true);

-- ============================================================
-- Después de correr esto:
-- 1) /admin/libros muestra los 28 nuevos en videoteca
-- 2) Click en card → editor → "Autorrellenar con TMDB" para los Hollywood
--    (los documentales Civilizaciones Perdidas no están en TMDB,
--     esos van con portada manual desde /admin/portadas)
-- 3) Faltan ~44 VHS del PDF que no extraje. Opciones:
--    a) Decirme "continúa leyendo el PDF" y sigo
--    b) Meter el resto manualmente desde /admin/libros con + Agregar
-- ============================================================
