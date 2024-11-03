<?php

function parse_remote_data() {
    $urls = array(
        'flag_base64' => 'https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-flag.json',
        'city' => 'https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-capital-city.json',
        'continent' => 'https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-continent.json',
        'abbreviation' => 'https://raw.githubusercontent.com/samayo/country-json/refs/heads/master/src/country-by-abbreviation.json',
    );

    $result = array();

    foreach ($urls as $key => $link) {
        $list = json_decode(file_get_contents($link), true);

        foreach ($list as $item) {
            $result[$key][$item['country']] = $item[$key];
        }
    }

    file_put_contents(__DIR__ . '/remote.json', json_encode($result));
}

function parse_local_data($result = array()) {
    $local = json_decode(file_get_contents(__DIR__ . '/remote.json'), true);

    foreach ($local['flag_base64'] as $country => $flag) {
        if (empty($local['abbreviation'][$country])) {
            continue;
        }

        if (empty($local['city'][$country])) {
            continue;
        }

        if (empty($local['continent'][$country])) {
            continue;
        }

        if (empty($flag)) {
            continue;
        }

        @mkdir(__DIR__ . '/../public/flags/');

        $path = __DIR__ . '/../public/flags/' . strtolower($local['abbreviation'][$country]) . '.svg';

        file_put_contents($path, base64_decode(explode(',', $flag)[1]));

        $result[] = array(
            'country' => $country,
            'code' => strtolower($local['abbreviation'][$country]),
            'capital' => $local['city'][$country],
            'continent' => $local['continent'][$country],
        );
    }

    file_put_contents(__DIR__ . '/../src/dictionary.json', json_encode($result));
}

parse_local_data();
