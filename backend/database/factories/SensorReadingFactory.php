<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class SensorReadingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'value' => $this->faker->randomFloat(2, 10, 100),
            // 'timestamp' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
